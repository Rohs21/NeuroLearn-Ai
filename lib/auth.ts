import type { Session, User } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Dynamically construct NEXTAUTH_URL for production
const getNextAuthUrl = (): string => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Vercel automatic URL detection
  if (process.env.VERCEL_URL) {
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'http'
    return `${protocol}://${process.env.VERCEL_URL}`
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000'
}

const nextAuthUrl = getNextAuthUrl()
const _nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET

if (!_nextAuthSecretSet) {
  console.warn(
    '[NextAuth][env-check] NEXTAUTH_URL=%s NEXTAUTH_SECRET_SET=%s',
    nextAuthUrl,
    _nextAuthSecretSet
  )
}

export const authOptions: any = {
  pages: {
    signIn: '/auth/signin',
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
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
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