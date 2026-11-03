import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET: Read-only access for Reception (to select in bills) and Admin/HR
export async function GET() {
  try {
    const authSettings = await requirePermission('SETTINGS', 'READ');
    const authReception = await requirePermission('RECEPTION', 'CREATE'); // Needs to see vendors to make a bill
    const authReceptionRead = await requirePermission('RECEPTION', 'READ'); 

    // Allow if they have Settings Read OR Reception access
    if (!authSettings.authorized && !authReception.authorized && !authReceptionRead.authorized) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view vendors.' }, { status: 403 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    
    const vendors = await prisma.vendor.findMany({
      where: { orgId: org.id },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// POST: STRICTLY Admin/HR only (SETTINGS:CREATE)
export async function POST(request: Request) {
  try {
    // ONLY Settings permission can add vendors. Reception is NO LONGER allowed.
    const authSettings = await requirePermission('SETTINGS', 'CREATE');

    if (!authSettings.authorized) {
      return NextResponse.json({ error: 'Forbidden. Only HR or Admin can add new vendors.' }, { status: 403 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const { name, phone, email, address } = await request.json();
    if (!name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });

    const newVendor = await prisma.vendor.create({
      data: {
        orgId: org.id,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null
      }
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}