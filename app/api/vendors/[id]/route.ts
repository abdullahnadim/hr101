import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// UPDATE a Vendor - STRICTLY Admin/HR (SETTINGS:UPDATE)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only HR/Admin with Settings Update permission can edit vendors
  const auth = await requirePermission('SETTINGS', 'UPDATE');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Forbidden. Only HR or Admin can edit vendors.' }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Removed contactPerson to match the actual deployed database schema
    const { name, phone, email, address } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null,
      }
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

// DELETE a Vendor - STRICTLY Admin/HR (SETTINGS:DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only HR/Admin with Settings Delete permission can delete vendors
  const auth = await requirePermission('SETTINGS', 'DELETE');
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Forbidden. Only HR or Admin can delete vendors.' }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    await prisma.vendor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    
    // Catch Prisma Foreign Key Constraint failures gracefully
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete this vendor because they are linked to existing bills. Please edit their details instead.' }, 
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}