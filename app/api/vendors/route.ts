import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
// Removed the broken authOptions import

const prisma = new PrismaClient();

// Fetch all vendors for the dropdown (with multi-module RBAC)
export async function GET() {
  try {
    // Call getServerSession without authOptions; NextAuth resolves it automatically
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roleName = (session.user as any)?.roleName;
    const permissions = (session.user as any)?.permissions || [];
    const isAdmin = roleName === 'ADMIN' || roleName === 'Super Admin';

    // Allow if Admin, OR has Settings Read, OR has Reception Read/Create
    const canViewVendors = isAdmin || 
                           permissions.includes('SETTINGS:READ') || 
                           permissions.includes('RECEPTION:CREATE') ||
                           permissions.includes('RECEPTION:READ');

    if (!canViewVendors) {
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
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roleName = (session.user as any)?.roleName;
    const permissions = (session.user as any)?.permissions || [];
    const isAdmin = roleName === 'ADMIN' || roleName === 'Super Admin';

    // Allow if Admin, OR has Settings Create, OR has Reception Create
    const canCreateVendors = isAdmin || 
                             permissions.includes('SETTINGS:CREATE') || 
                             permissions.includes('RECEPTION:CREATE');

    if (!canCreateVendors) {
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
        // Removed status: 'ACTIVE' to fix the Prisma TS Build Error
      }
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}