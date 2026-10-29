import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [receptionAuth, accountsAuth, auditAuth] = await Promise.all([
    requirePermission('RECEPTION', 'UPDATE'),
    requirePermission('ACCOUNTS', 'UPDATE'),
    requirePermission('AUDIT', 'UPDATE')
  ]);

  if (!receptionAuth.authorized && !accountsAuth.authorized && !auditAuth.authorized) {
    return NextResponse.json({ error: 'Forbidden: Missing Workflow Permissions' }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { status, discrepancyNote } = await request.json();

    if (!id || !status) return NextResponse.json({ error: 'Bill ID and Status are required' }, { status: 400 });

    const existing = await prisma.receptionBill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    // Auto-stamp the timeline based on the incoming status
    const dataToUpdate: any = { 
      status,
      discrepancyNote: status === 'DISCREPANCY' ? discrepancyNote : null 
    };

    if (status === 'SENT_TO_ACCOUNTS') dataToUpdate.accountsReceivedAt = new Date();
    if (status === 'SENT_TO_AUDIT') dataToUpdate.auditReceivedAt = new Date();
    if (status === 'APPROVED_FOR_DISBURSEMENT') dataToUpdate.approvedAt = new Date();
    if (status === 'DISBURSED') dataToUpdate.disbursedAt = new Date();

    const updatedBill = await prisma.receptionBill.update({
      where: { id },
      data: dataToUpdate,
      include: {
        vendor: { select: { name: true } },
        recordedBy: { select: { name: true, employeeCode: true } }
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill status:", error);
    return NextResponse.json({ error: 'Failed to update workflow status' }, { status: 500 });
  }
}