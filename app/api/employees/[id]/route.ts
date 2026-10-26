import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Safely parse the incoming stringified JSON so Prisma's Json type accepts it
    const rawDynamicData = body.customData || body.notes;
    const parsedCustomData = typeof rawDynamicData === 'string' ? JSON.parse(rawDynamicData) : rawDynamicData || null;
    
    const updatedEmployee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        email: body.email || null, 
        phone: body.phone,
        position: body.position,
        department: body.department,
        status: body.status,
        joiningDate: body.joiningDate || body.joinDate ? new Date(body.joiningDate || body.joinDate) : undefined,
        
        // FIXED: Explicitly target customData and pass the parsed JSON object
        customData: parsedCustomData,
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}