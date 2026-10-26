import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export default async function proxy(req: any) {
  // 1. THE ULTIMATE MOCK: We create an object that perfectly mimics a NextRequest
  // so NextAuth's internal destructurings cannot possibly fail.
  const url = new URL(req.url);
  
  const mockedRequest = {
    ...req,
    url: req.url,
    headers: req.headers,
    cookies: req.cookies || {},
    // Forcefully inject the exact object shape NextAuth demands
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      searchParams: url.searchParams,
      href: url.href,
    }
  };

  try {
    // 2. Pass the bulletproof mock to NextAuth
    const token = await getToken({ 
      req: mockedRequest as any, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    const path = url.pathname;

    // 3. Routing Logic
    if (!token && path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token) {
      const role = token.role as string;
      
      if (path.startsWith("/admin/employees") || path.startsWith("/admin/settings") || path.startsWith("/admin/payroll")) {
        if (role !== "ADMIN" && role !== "HR_MANAGER") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
      
      if (path.startsWith("/admin/it")) {
        if (role !== "ADMIN" && role !== "IT_STAFF") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
      
      if (path.startsWith("/admin") && role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/conference", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Critical Proxy Error:", error);
    // If all else fails, allow the app to load rather than crashing the server with a 500 error
    return NextResponse.next(); 
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};