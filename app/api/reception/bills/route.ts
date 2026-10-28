import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET: Fetch all log book entries
export async function GET(request: Request) {
  const auth = await requirePermission('RECEPTION', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const bills = await prisma.receptionBill.findMany({
      where: { orgId: org.id },
      include: {
        vendor: { select: { name: true } },
        recordedBy: { select: { name: true, employeeCode: true } }
      },
      orderBy: { entryAt: 'desc' }
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json({ error: 'Failed to fetch reception logs' }, { status: 500 });
  }
}

// POST: Create a new bill entry with auto-incrementing ID
export async function POST(request: Request) {
  const auth = await requirePermission('RECEPTION', 'CREATE');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // TEMPORARY: For testing, fetch the first employee if session auth is not yet wired
    const testUser = await prisma.user.findFirst({ where: { employeeId: { not: null } } });
    const employeeId = testUser?.employeeId; 

    const { vendorId, billDate, amount } = await request.json();

    if (!vendorId || !billDate || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Generate the FAL-Bill-XXXX Sequence
    // We run this in a transaction to prevent race conditions if two receptionists save at the exact same millisecond
    const newBill = await prisma.$transaction(async (tx) => {
      // Find the most recent bill for this org to determine the next number
      const lastBill = await tx.receptionBill.findFirst({
        where: { orgId: org.id, billNumber: { startsWith: 'FAL-Bill-' } },
        orderBy: { createdAt: 'desc' }
      });

      let nextNumber = 1;
      if (lastBill) {
        const parts = lastBill.billNumber.split('-');
        if (parts.length === 3) {
          nextNumber = parseInt(parts[2], 10) + 1;
        }
      }

      // Format with leading zeros (e.g., 0001, 0042, 0150)
      const formattedNumber = `FAL-Bill-${nextNumber.toString().padStart(4, '0')}`;

      // 2. Create the record
      return await tx.receptionBill.create({
        data: {
          orgId: org.id,
          billNumber: formattedNumber,
          billDate: new Date(billDate),
          vendorId: vendorId, // Maps directly to the Vendor relational model
          amount: parseFloat(amount),
          recordedById: employeeId,
          // entryAt is automatically set by the @default(now()) in Prisma
        },
        include: {
          vendor: { select: { name: true } },
          recordedBy: { select: { name: true } }
        }
      });
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bill entry:", error);
    
    // Handle Prisma Unique Constraint violation specifically
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A sequence collision occurred. Please try saving again.' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to record bill' }, { status: 500 });
  }
}