import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const path = req.nextUrl.pathname;

    const routeGuards: Record<string, string> = {
      "/admin/accounts": "ACCOUNTS:READ",
      "/accounts":       "ACCOUNTS:READ",
      "/admin/audit":    "AUDIT:READ",
      "/audit":          "AUDIT:READ",
      "/admin/payroll":  "PAYROLL:READ",
      "/recruitment":    "RECRUITMENT:READ",
      "/admin/it":       "IT_ASSETS:READ",
      "/admin/settings": "SETTINGS:READ",
      "/admin/employees":"HR_HUB:READ",
      "/reception":      "RECEPTION:READ"
    };

    const isProtectedRoute = Object.keys(routeGuards).some(route => path.startsWith(route));

    if (!token && (path.startsWith("/admin") || isProtectedRoute)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token) {
      // THE ADMIN BYPASS
      const roleName = token.roleName as string;
      const isAdmin = roleName === 'ADMIN' || roleName === 'Super Admin';
      const userPermissions = (token.permissions as string[]) || [];

      // If they are not an Admin, strictly check their granular permissions
      if (!isAdmin) {
        for (const [protectedRoute, requiredPermission] of Object.entries(routeGuards)) {
          if (path.startsWith(protectedRoute) && !userPermissions.includes(requiredPermission)) {
            return NextResponse.redirect(new URL("/", req.url));
          }
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.next(); 
  }
}

export const config = {
  matcher: ["/admin/:path*", "/recruitment/:path*", "/accounts/:path*", "/audit/:path*", "/reception/:path*"],
};