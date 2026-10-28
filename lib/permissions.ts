import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function requirePermission(module: string, action: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userPermissions = (session.user as any).permissions || [];
  const requiredPermission = `${module}:${action}`;

  if (!userPermissions.includes(requiredPermission)) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden: Missing Permission" }, { status: 403 }) };
  }

  return { authorized: true, session };
}