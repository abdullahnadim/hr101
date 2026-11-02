import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Verify user has workflow update permissions across any of the 3 modules
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

    // 2. Build the exact data payload
    const dataToUpdate: any = { status };

    // 3. Robust Discrepancy Note Handling
    if (status === 'DISCREPANCY') {
      // Ensure it always saves a string, even if the frontend payload glitches
      dataToUpdate.discrepancyNote = discrepancyNote?.trim() || 'Returned for review without specific comments.';
    } else if (status === 'SENT_TO_ACCOUNTS' || status === 'SENT_TO_AUDIT') {
      // Clear the red error message when it moves forward in the pipeline again
      dataToUpdate.discrepancyNote = null;
    }

    // 4. Premium Auto-Stamping for Timeline
    if (status === 'SENT_TO_ACCOUNTS') dataToUpdate.accountsReceivedAt = new Date();
    if (status === 'SENT_TO_AUDIT') dataToUpdate.auditReceivedAt = new Date();
    
    if (status === 'APPROVED_FOR_DISBURSEMENT') {
      dataToUpdate.approvedAt = new Date();
      
      // Attempt to log exactly who approved it
      const session = await getServerSession();
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user?.employeeId) {
          // If you have `approvedById` in your prisma schema, this connects it automatically
          dataToUpdate.approvedById = user.employeeId; 
        }
      }
    }
    
    if (status === 'DISBURSED') dataToUpdate.disbursedAt = new Date();

    // 5. Save and Return
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