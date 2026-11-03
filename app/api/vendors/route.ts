import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

// Force Vercel to fetch fresh data every time, disabling static build cache
export const dynamic = 'force-dynamic'; 

const prisma = new PrismaClient();

// GET: Read-only access for Reception and Admin/HR
export async function GET() {
  try {
    const authSettings = await requirePermission('SETTINGS', 'READ');
    const authReception = await requirePermission('RECEPTION', 'CREATE'); 
    const authReceptionRead = await requirePermission('RECEPTION', 'READ'); 

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
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// POST: STRICTLY Admin/HR only (SETTINGS:CREATE)
export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}