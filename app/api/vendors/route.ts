import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// Fetch all vendors for the dropdown (with multi-module RBAC)
export async function GET() {
  try {
    const authRead = await requirePermission('RECEPTION', 'READ');
    const authSettings = await requirePermission('SETTINGS', 'READ');
    const authCreate = await requirePermission('RECEPTION', 'CREATE');

    if (!authRead.authorized && !authSettings.authorized && !authCreate.authorized) {
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

// Quick-create a vendor from the Bill Entry modal (with multi-module RBAC)
export async function POST(request: Request) {
  try {
    const authSettings = await requirePermission('SETTINGS', 'CREATE');
    const authReception = await requirePermission('RECEPTION', 'CREATE');

    if (!authSettings.authorized && !authReception.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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