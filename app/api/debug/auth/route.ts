import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Temporary debug endpoint to check whether a valid NextAuth JWT is
// present for the incoming request. Do NOT leave enabled long-term in
// production; it's intended as a short-lived diagnostic helper.
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const result = {
      tokenPresent: !!token,
      tokenInfo: token
        ? { sub: (token as any)?.sub ?? null, exp: (token as any)?.exp ?? null }
        : null,
      env: {
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET
      }
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
