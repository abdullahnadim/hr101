import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Security Check: Prevent running this if an admin already exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@fal.com.bd' }
    });

    if (adminExists) {
      return NextResponse.json({ message: 'Setup already complete. Admin account exists.' }, { status: 403 });
    }

    // 2. Create the base Organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Fashion Asia Limited' }
      });
    }

    // 3. Create the Super Admin Role
    let superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: { name: 'Super Admin', description: 'Master System Administrator with universal bypass' }
      });
    }

    // 4. Create the Employee Profile for the Admin
    const adminEmployee = await prisma.employee.create({
      data: {
        orgId: org.id,
        employeeCode: 'FAL-ADMIN',
        name: 'System Administrator',
        email: 'admin@fal.com.bd',
        phone: '01700000000', // FIX: Added required phone field
        position: 'Super Admin',
        department: 'IT',
        joiningDate: new Date(),
        status: 'ACTIVE',
      }
    });

    // 5. Create the System User Account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        email: 'admin@fal.com.bd',
        passwordHash: hashedPassword, // FIX: Changed from 'password' to 'passwordHash'
        orgId: org.id,                // FIX: Added required orgId field
        roleId: superAdminRole.id,
        employeeId: adminEmployee.id,
      }
    });

    return NextResponse.json({ message: 'Success! Super Admin account created. You can now log in.' }, { status: 201 });
  } catch (error) {
    console.error('Setup Error:', error);
    return NextResponse.json({ error: 'Failed to run initial setup.' }, { status: 500 });
  }
}