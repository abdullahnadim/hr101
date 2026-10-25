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
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organization not found");

    const newEmployee = await prisma.employee.create({
      data: {
        orgId: org.id,
        employeeCode: body.employeeCode, 
        name: body.name,
        email: body.email || null, // FIX: Prevents empty string crashes
        phone: body.phone,
        position: body.position,
        department: body.department,
        joiningDate: new Date(body.joiningDate),
      }
    });

    return NextResponse.json(newEmployee);
  } catch (error) {
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
    return NextResponse.json({ error: 'Failed to delete employees' }, { status: 500 });
  }
}