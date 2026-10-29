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
    
    const { vendorId, billDate, amount, category, billNumber, department, description } = await request.json();

    if (!id || !vendorId || !billDate || amount === undefined || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Anti-Tamper Check: Ensure bill is still in Draft or Discrepancy mode
    const existing = await prisma.receptionBill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    
    if (existing.status !== 'DRAFT' && existing.status !== 'DISCREPANCY') {
      return NextResponse.json({ error: 'Cannot modify a bill that is currently under Accounts/Audit review.' }, { status: 403 });
    }

    const updatedBill = await prisma.receptionBill.update({
      where: { id },
      data: {
        vendorId,
        billNumber: billNumber || null,
        billDate: new Date(billDate),
        amount: parseFloat(amount),
        category,
        department: department || null,
        description: description || null,
        // Resubmitting a discrepant bill pushes it back to DRAFT or directly to ACCOUNTS depending on your workflow
        status: existing.status === 'DISCREPANCY' ? 'DRAFT' : existing.status,
      },
      include: {
        vendor: { select: { name: true } }, 
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

    const existing = await prisma.receptionBill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    // Only allow deletion of Draft bills
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT entries can be permanently deleted.' }, { status: 403 });
    }

    await prisma.receptionBill.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json({ error: 'Failed to delete bill entry' }, { status: 500 });
  }
}