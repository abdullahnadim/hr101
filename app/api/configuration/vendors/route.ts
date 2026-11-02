import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Receptionists can read the list to attach to bills, Admins can read for settings
    const authSettings = await requirePermission('SETTINGS', 'READ');
    const authReception = await requirePermission('RECEPTION', 'CREATE');
    const authReceptionRead = await requirePermission('RECEPTION', 'READ');
    
    if (!authSettings.authorized && !authReception.authorized && !authReceptionRead.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

export async function POST(request: Request) {
  try {
    // STRICT: Only Admin or users with explicit SETTINGS:CREATE can add vendors
    const authSettings = await requirePermission('SETTINGS', 'CREATE');
    
    if (!authSettings.authorized) {
      return NextResponse.json({ error: 'Forbidden. Only Admins or HR can create vendors.' }, { status: 403 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const { name, contactPerson, email, phone, address } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const newVendor = await prisma.vendor.create({
      data: {
        orgId: org.id,
        name: name.trim(),
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}