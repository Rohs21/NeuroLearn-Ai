import type { Session, User } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        address: { label: "Wallet Address", type: "text" }
      },
      async authorize(credentials) {
        // Handle wallet login
        if (credentials?.address && !credentials?.email && !credentials?.password) {
          const user = await prisma.user.findUnique({
            where: {
              walletAddress: credentials.address
            }
          })

          if (!user) {
            // Create new user with wallet address
            const newUser = await prisma.user.create({
              data: {
                walletAddress: credentials.address,
                email: `${credentials.address}@wallet.local`
              }
            })
            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }

        // Handle email/password login
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
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>, user?: User }) {
      if (user) {
        token.id = user.id
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