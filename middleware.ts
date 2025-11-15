import { withAuth } from "next-auth/middleware"

// Basic runtime env check to catch missing NEXTAUTH variables on Vercel/production.
const _nextAuthUrl = process.env.NEXTAUTH_URL
const _nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET
if (!_nextAuthUrl || !_nextAuthSecretSet) {
  console.warn('[NextAuth][middleware][env-check] NEXTAUTH_URL=%s NEXTAUTH_SECRET_SET=%s', _nextAuthUrl || 'MISSING', _nextAuthSecretSet)
}

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    try {
      const hasToken = !!req.nextauth?.token
      if (!hasToken) {
        console.log('[NextAuth][middleware] No auth token found for', req.nextUrl?.pathname)
        return
      }
      console.log('[NextAuth][middleware] Token present for', req.nextUrl?.pathname)
    } catch (e) {
      console.error('[NextAuth][middleware] runtime error', e)
    }
  },
  {
    callbacks: {
      // Allow unauthenticated GET access to /watch so client-side localStorage-driven
      // playback doesn't get redirected by server-side auth checks. For other
      // protected routes, require a token as before.
      authorized: ({ token, req }) => {
        try {
          const pathname = req.nextUrl.pathname || '';
          
          // Strictly require authentication for dashboard routes
          if (pathname.startsWith('/dashboard')) {
            return !!token;
          }

          // Allow read-only GET requests to the watch page without a token
          if (pathname.startsWith('/watch') && req.method === 'GET') {
            return true;
          }

          // For other protected routes
          return !!token;
        } catch (e) {
          console.error('Auth middleware error:', e);
          return false;
        }
      }
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/watch/:path*",
    "/api/video/:path*",
    "/api/history/:path*",
    "/api/user/:path*"
  ]
}