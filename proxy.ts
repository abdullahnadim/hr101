import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // Only allow ADMIN or HR_MANAGER to access /admin routes
    if (isAdminRoute && token?.role !== "ADMIN" && token?.role !== "HR_MANAGER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Requires the user to be logged in
    },
  }
);

// Apply this middleware only to /admin and its sub-routes
export const config = {
  matcher: ["/admin/:path*"]
};