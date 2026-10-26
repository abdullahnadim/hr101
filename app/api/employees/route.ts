import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
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

    // Parse the JSON for the new employee record
    const rawDynamicData = body.customData || body.notes;
    const parsedCustomData = typeof rawDynamicData === 'string' ? JSON.parse(rawDynamicData) : rawDynamicData || null;

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
        
        // FIXED: Only customData is passed to Prisma now
        customData: parsedCustomData, 
      }
    });

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