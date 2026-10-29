import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = await requirePermission('RECEPTION', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Calculate the start of the current day (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Execute aggregate counts in parallel for maximum efficiency
    const [enteredToday, sentToAccounts, discrepancies] = await Promise.all([
      prisma.receptionBill.count({
        where: { 
          orgId: org.id, 
          entryAt: { gte: startOfToday } 
        }
      }),
      prisma.receptionBill.count({
        where: { 
          orgId: org.id, 
          status: 'SENT_TO_ACCOUNTS' 
        }
      }),
      prisma.receptionBill.count({
        where: { 
          orgId: org.id, 
          status: 'DISCREPANCY' 
        }
      })
    ]);

    return NextResponse.json({
      enteredToday,
      sentToAccounts,
      discrepancies
    });
  } catch (error) {
    console.error("Error fetching reception stats:", error);
    return NextResponse.json({ error: 'Failed to aggregate dashboard statistics' }, { status: 500 });
  }
}