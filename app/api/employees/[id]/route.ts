import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch individual employee profile with relational data
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id: resolvedParams.id },
      include: {
        itAssets: true,
        roomBookings: {
          orderBy: { date: 'desc' },
          take: 10 // Fetch latest 10 bookings for the activity tab
        },
        user: {
          select: { role: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

// PUT: Update employee profile and compensation configuration
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position,
        department: body.department,
        status: body.status,
        joiningDate: body.joinDate ? new Date(body.joinDate) : undefined,
        customData: body.customData,
        
        // Parsed Financial & Compensation Fields
        baseSalary: parseFloat(body.baseSalary) || 0,
        increment: parseFloat(body.increment) || 0,
        taxPercentage: parseFloat(body.taxPercentage) || 0,
        taxAmount: parseFloat(body.taxAmount) || 0,
        allowance: parseFloat(body.allowance) || 0,
        transportAllowance: parseFloat(body.transportAllowance) || 0,
        mobileBillLimit: parseFloat(body.mobileBillLimit) || 0,
        usesCompanyTransport: Boolean(body.usesCompanyTransport),
        transportRouteFare: parseFloat(body.transportRouteFare) || 0,
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: 'Failed to update employee profile' }, { status: 500 });
  }
}

// DELETE: Terminate / Remove employee record
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    await prisma.employee.delete({ 
      where: { id: resolvedParams.id } 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}