import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    console.log("Token:", req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
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