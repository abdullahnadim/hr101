import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Enforce Audit Access
  const auth = await requirePermission('AUDIT', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const bills = await prisma.receptionBill.findMany({
      where: { 
        orgId: org.id,
        // Audit only sees bills forwarded to them, or bills they have approved
        status: { in: ['SENT_TO_AUDIT', 'APPROVED_FOR_DISBURSEMENT'] }
      },
      include: {
        vendor: { select: { name: true } },
        recordedBy: { select: { name: true, employeeCode: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching audit bills:", error);
    return NextResponse.json({ error: 'Failed to fetch audit queue' }, { status: 500 });
  }
}