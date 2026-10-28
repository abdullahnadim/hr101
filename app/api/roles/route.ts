import { NextResponse } from "next/server";
import { PrismaClient, AppModule, PermissionAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";

const prisma = new PrismaClient();

export async function GET() {
  const auth = await requirePermission('SETTINGS', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requirePermission('SETTINGS', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const { roleId, permissions } = await req.json();

    // ANTI-LOCKOUT: Prevent modification of the core Admin role
    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (targetRole?.name === 'ADMIN' || targetRole?.name === 'Super Admin') {
      return NextResponse.json({ error: "Core Admin role cannot be modified." }, { status: 403 });
    }

    // Map string payload ("ACCOUNTS:READ") back to Prisma Enums
    const newPermissions = permissions.map((p: string) => {
      const [module, action] = p.split(':');
      return {
        roleId,
        module: module as AppModule,
        action: action as PermissionAction
      };
    });

    // ATOMIC TRANSACTION: Safely wipe old permissions and insert the new ones
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({ data: newPermissions })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role Update Error:", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission('SETTINGS', 'CREATE');
  if (!auth.authorized) return auth.response;

  try {
    const { name, description } = await req.json();
    const newRole = await prisma.role.create({
      data: { name, description },
      include: { permissions: true }
    });
    return NextResponse.json(newRole);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}