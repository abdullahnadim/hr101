import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch all vendors for the dropdown
export async function GET() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    
    const vendors = await prisma.vendor.findMany({
      where: { orgId: org.id },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// Quick-create a vendor from the Bill Entry modal
export async function POST(request: Request) {
  try {
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
        address: address || null,
      }
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}