import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    if (!req.nextauth?.token) {
      console.log("No auth token found");
      return;
    }
    console.log("Token present:", !!req.nextauth.token);
  },
  {
    callbacks: {
      // Allow unauthenticated GET access to /watch so client-side localStorage-driven
      // playback doesn't get redirected by server-side auth checks. For other
      // protected routes, require a token as before.
      authorized: ({ token, req }) => {
        try {
          const pathname = req.nextUrl.pathname || ''
          // Allow read-only GET requests to the watch page without a token
          if (pathname.startsWith('/watch') && req.method === 'GET') {
            return true
          }
        } catch (e) {
          // ignore and fallthrough to token check
        }
        return !!token
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