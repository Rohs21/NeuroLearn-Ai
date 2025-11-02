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