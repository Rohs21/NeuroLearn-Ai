import { NextRequest, NextResponse } from "next/server"

// Temporary debug endpoint to check whether a valid NextAuth JWT is
// present for the incoming request. Do NOT leave enabled long-term in
// production; it's intended as a short-lived diagnostic helper.
export async function GET(req: NextRequest) {
  try {
    // Dynamically import `getToken` to avoid TypeScript/typing issues
    // across NextAuth versions in the build environment.
    let getToken: any = null
    try {
      const mod = (await import('next-auth/jwt')) as any
      getToken = mod.getToken || mod.default?.getToken
    } catch (e) {
      // Module may not export getToken in this NextAuth version; continue
      console.warn('[debug/auth] could not import getToken from next-auth/jwt', e)
    }

    let token: any = null
    if (getToken) {
      token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    } else {
      // Fallback: attempt to read cookie header for manual inspection
      const cookie = req.headers.get('cookie') || null
      token = cookie ? { cookiePreview: cookie.substring(0, 200) } : null
    }

    const result = {
      tokenPresent: !!token,
      tokenInfo: token
        ? typeof token === 'object'
          ? { sub: (token as any)?.sub ?? null, exp: (token as any)?.exp ?? null }
          : { preview: String(token).substring(0, 200) }
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
