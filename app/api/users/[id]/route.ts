import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// UPDATE A USER'S ROLE OR PASSWORD
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Awaitable params for Next.js 15+
) {
  const auth = await requirePermission('SETTINGS', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { roleId, password } = await request.json();

    if (!id || !roleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Protect Master Admin
    const targetUser = await prisma.user.findUnique({ where: { id }, include: { role: true }});
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if ((targetUser.role?.name === 'ADMIN' || targetUser.role?.name === 'Super Admin') && roleId !== targetUser.roleId) {
       return NextResponse.json({ error: "Cannot change the role of the core Master Administrator account." }, { status: 403 });
    }

    // Prepare Update payload
    const updateData: any = { roleId };
    
    // Hash new password if provided
    if (password && password.trim() !== '') {
       updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { 
        employee: { select: { name: true, position: true, department: true, employeeCode: true } }, 
        role: true 
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE A USER (Revoke Access)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Awaitable params for Next.js 15+
) {
  const auth = await requirePermission('SETTINGS', 'DELETE');
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id }, include: { role: true }});
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.role?.name === 'ADMIN' || targetUser.role?.name === 'Super Admin') {
      return NextResponse.json({ error: 'Cannot delete the core Master Administrator account.' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking user access:", error);
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
  }
}