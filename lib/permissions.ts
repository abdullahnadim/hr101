// Example of what your lib/permissions.ts should look like:
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Update path if needed
import { NextResponse } from "next/server";

export async function requirePermission(module: string, action: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const roleName = (session.user as any).roleName;
  const permissions = (session.user as any).permissions || [];

  // 1. UNIVERSAL BYPASS FOR MASTER ADMIN
  if (roleName === 'ADMIN' || roleName === 'Super Admin') {
    return { authorized: true, session };
  }

  // 2. CHECK SPECIFIC PERMISSIONS FOR STANDARD USERS
  const requiredPermission = `${module}:${action}`;
  if (!permissions.includes(requiredPermission)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: `Forbidden: Missing Permission (${requiredPermission})` }, { status: 403 }) 
    };
  }

  return { authorized: true, session };
}