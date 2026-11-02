import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Enforce Accounts Access
  const auth = await requirePermission('ACCOUNTS', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Fetch bills waiting for Accounts review, fully approved, or disbursed
    const bills = await prisma.receptionBill.findMany({
      where: { 
        orgId: org.id,
        status: { 
          in: ['SENT_TO_ACCOUNTS', 'APPROVED_FOR_DISBURSEMENT', 'DISBURSED'] 
        }
      },
      include: {
        vendor: { select: { name: true } },
        recordedBy: { select: { name: true, employeeCode: true } },
        // If your schema supports approvedBy, uncomment the line below. Otherwise leave it removed.
        // approvedBy: { select: { name: true } } 
      },
      orderBy: { createdAt: 'desc' } // Newest entries first
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching accounts bills:", error);
    return NextResponse.json({ error: 'Failed to fetch financial bills' }, { status: 500 });
  }
}