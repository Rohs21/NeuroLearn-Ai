import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth/next"

const handler = NextAuth(authOptions)

// Export the NextAuth handler directly for the App Router. Using a custom
// GET/POST wrapper can change the shape of the `req` object passed to
// NextAuth and cause runtime errors like "req.query is undefined".
export { handler as GET, handler as POST }