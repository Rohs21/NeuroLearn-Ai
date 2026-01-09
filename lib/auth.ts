import type { Session, User } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Basic environment checks to help diagnose production issues where
// NextAuth requires `NEXTAUTH_URL` and `NEXTAUTH_SECRET` to be set.
const _nextAuthUrl = process.env.NEXTAUTH_URL
const _nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET
if (!_nextAuthUrl || !_nextAuthSecretSet) {
  console.warn(
    '[NextAuth][env-check] NEXTAUTH_URL=%s NEXTAUTH_SECRET_SET=%s',
    _nextAuthUrl || 'MISSING',
    _nextAuthSecretSet
  )
}

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>, user?: User }) {
      if (user) {
        // Attach user id into the token for downstream session population.
        // This log helps confirm that the JWT callback runs in production.
        try {
          // user may be a partial object depending on provider
          // Avoid logging sensitive info; only log the id presence.
          // @ts-ignore
          const uid = user?.id ?? '[no-id]'
          console.log('[NextAuth][jwt] attaching user id:', uid)
        } catch (e) {
          console.warn('[NextAuth][jwt] logging error', e)
        }
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }: { session: Session, token: Record<string, unknown> }) {
      // Populate session.user.id from the token for client access.
      try {
        if (token && session.user) {
          // Avoid exposing token contents; only ensure id is present.
          session.user.id = token.id as string
        }
        console.log('[NextAuth][session] session created, userId=', session.user?.id ?? 'none')
      } catch (e) {
        console.warn('[NextAuth][session] error populating session', e)
      }
      return session
    }
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      try {
        console.log('[NextAuth][event] signIn userId=', user?.id ?? 'unknown', 'isNewUser=', !!isNewUser)
      } catch (e) {
        console.warn('[NextAuth][event] signIn logging failed', e)
      }
    }
  }
}