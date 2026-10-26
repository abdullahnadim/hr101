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
    
    const updatedAsset = await prisma.iTAsset.update({
      where: { id: resolvedParams.id },
      data: {
        condition: body.condition,
        status: body.status,
        assignedToId: body.assignedToId || null,
        notes: body.notes
      },
      include: {
        assignedTo: { select: { name: true, employeeCode: true, department: true } }
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.iTAsset.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}