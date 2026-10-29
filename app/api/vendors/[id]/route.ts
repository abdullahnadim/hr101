import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// UPDATE a Vendor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15+ awaitable params
) {
  const auth = await requirePermission('SETTINGS', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { name, phone, email, address, status } = await request.json();

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
        status: status || 'ACTIVE',
      }
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

// DELETE a Vendor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('SETTINGS', 'DELETE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    await prisma.vendor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    
    // Check if the error is a Prisma Foreign Key Constraint failure (P2003)
    // This happens because of the `onDelete: Restrict` in our schema.
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete this vendor because they are linked to existing bills. Try marking them as INACTIVE instead.' }, 
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}