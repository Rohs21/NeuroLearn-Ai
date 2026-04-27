import type { Session, User } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
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
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }: { session: Session, token: Record<string, unknown> }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}