import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: { user: { include: { role: true } } }, // Fetch associated role
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organization not found");

    const rawDynamicData = body.customData || body.notes;
    const parsedCustomData = typeof rawDynamicData === 'string' ? JSON.parse(rawDynamicData) : rawDynamicData || null;

    // 1. Create the Employee Record
    const newEmployee = await prisma.employee.create({
      data: {
        orgId: org.id,
        employeeCode: body.employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`, 
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        position: body.position,
        department: body.department,
        status: body.status || 'ACTIVE',
        joiningDate: body.joiningDate || body.joinDate ? new Date(body.joiningDate || body.joinDate) : new Date(),
        customData: parsedCustomData, 
      }
    });

    // 2. If an email and Role ID were provided, create the User Login Account
    if (body.email && body.roleId) {
      const defaultPassword = 'Password123!'; // We set a default password
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await prisma.user.create({
        data: {
          email: body.email,
          passwordHash: hashedPassword,
          orgId: org.id,
          employeeId: newEmployee.id,
          roleId: body.roleId // Link the RBAC Role!
        }
      });
    }

    return NextResponse.json(newEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await prisma.employee.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employees:", error);
    return NextResponse.json({ error: 'Failed to delete employees' }, { status: 500 });
  }
}