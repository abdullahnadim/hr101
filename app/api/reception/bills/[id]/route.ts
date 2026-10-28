import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// UPDATE a bill entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15+ awaitable params
) {
  // 1. Enforce Central RBAC 'UPDATE' Permission
  const auth = await requirePermission('RECEPTION', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { vendorName, billDate, amount } = await request.json();

    if (!id || !vendorName || !billDate || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedBill = await prisma.receptionBill.update({
      where: { id },
      data: {
        vendorName: vendorName.trim(),
        billDate: new Date(billDate),
        amount: parseFloat(amount),
      },
      include: {
        recordedBy: { select: { name: true, employeeCode: true } }
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json({ error: 'Failed to update bill entry' }, { status: 500 });
  }
}

// DELETE a bill entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Enforce Central RBAC 'DELETE' Permission
  const auth = await requirePermission('RECEPTION', 'DELETE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    await prisma.receptionBill.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json({ error: 'Failed to delete bill entry' }, { status: 500 });
  }
}