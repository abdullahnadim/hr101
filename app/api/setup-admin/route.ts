import { NextResponse } from "next/server";
import { PrismaClient, AppModule, PermissionAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 🔒 THE VAULT DOOR: Only execute if zero users exist in the system.
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ error: "System already initialized." }, { status: 403 });
    }

    const { email, password, fullName, companyName } = await req.json();

    // 1. Create Organization
    const org = await prisma.organization.create({
      data: { name: companyName || "FAL Enterprise", timezone: "Asia/Dhaka" }
    });

    // 2. Create the Master Admin Role with ALL permissions dynamically
    const allModules = Object.values(AppModule);
    const allActions = Object.values(PermissionAction);
    const fullPermissions = allModules.flatMap(module => 
      allActions.map(action => ({ module, action }))
    );

    const adminRole = await prisma.role.create({
      data: { 
        name: 'ADMIN', 
        description: 'Master System Administrator',
        permissions: { create: fullPermissions }
      }
    });

    // 3. Create the Employee Profile
    const adminEmployee = await prisma.employee.create({
      data: {
        orgId: org.id,
        employeeCode: "ADM-001",
        name: fullName,
        email: email,
        phone: "+8801000000000",
        position: "System Administrator",
        department: "IT & Management",
        joiningDate: new Date(),
      }
    });

    // 4. Create the User Login
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        orgId: org.id,
        employeeId: adminEmployee.id,
        roleId: adminRole.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Failed to initialize system." }, { status: 500 });
  }
}