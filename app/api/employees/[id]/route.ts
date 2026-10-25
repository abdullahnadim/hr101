import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Remove the ID from the body so we don't try to overwrite it
    const { id, ...updateData } = body;

    const updatedEmployee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}