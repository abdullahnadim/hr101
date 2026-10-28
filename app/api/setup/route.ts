import { NextResponse } from "next/server";
import { PrismaClient, AppModule, PermissionAction } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Ensure the ADMIN role exists
    let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    
    // Generate all module & action combinations for Super Admin
    const allModules = Object.values(AppModule);
    const allActions = Object.values(PermissionAction);
    const fullPermissions = [];

    for (const module of allModules) {
      for (const action of allActions) {
        fullPermissions.push({ module, action });
      }
    }

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { 
          name: 'ADMIN', 
          description: 'Super Administrator with full access',
          permissions: {
            create: fullPermissions
          }
        }
      });
    } else {
      // Refresh permissions for existing Admin role
      await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
      await prisma.rolePermission.createMany({
        data: fullPermissions.permissions ? [] : fullPermissions.map(p => ({ roleId: adminRole!.id, ...p }))
      });
    }

    // 2. Assign this Admin role to ALL existing users so nobody gets locked out
    await prisma.user.updateMany({
      data: { roleId: adminRole.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Permissions successfully reset! Please Sign Out and Log Back In to refresh your JWT token." 
    });
  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Failed to setup permissions" }, { status: 500 });
  }
}