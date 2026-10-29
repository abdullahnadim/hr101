import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('IT_ASSETS', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const body = await request.json();
    const assetId = resolvedParams.id;

    // Fetch current asset to compare changes for history logging
    const currentAsset = await prisma.iTAsset.findUnique({
      where: { id: assetId },
      include: { assignedTo: true }
    });

    if (!currentAsset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    let historyLog = '';
    const dateStr = new Date().toISOString().split('T')[0];

    if (body.assignedToId !== currentAsset.assignedToId) {
      if (body.assignedToId) {
        const newEmp = await prisma.employee.findUnique({ where: { id: body.assignedToId } });
        historyLog += `\n[${dateStr}] Assigned to ${newEmp?.name} (${newEmp?.employeeCode}).`;
      } else {
        historyLog += `\n[${dateStr}] Unassigned from ${currentAsset.assignedTo?.name}. Returned to IT.`;
      }
    }

    if (body.status !== currentAsset.status) {
      historyLog += `\n[${dateStr}] Status changed from ${currentAsset.status} to ${body.status}.`;
    }

    if (body.condition !== currentAsset.condition) {
      historyLog += `\n[${dateStr}] Condition updated to ${body.condition}.`;
    }
    
    // Prepend manual notes provided in the form, then append system history logs
    const updatedNotes = [body.notes, historyLog].filter(Boolean).join('\n').trim();

    const updatedAsset = await prisma.iTAsset.update({
      where: { id: assetId },
      data: {
        condition: body.condition,
        status: body.status,
        location: body.location,
        ipAddress: body.ipAddress,
        notes: updatedNotes,
        assignedToId: body.assignedToId || null,
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
  const auth = await requirePermission('IT_ASSETS', 'DELETE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    await prisma.iTAsset.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}