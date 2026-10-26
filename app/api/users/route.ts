import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: { select: { name: true, position: true, department: true } }
      },
      orderBy: { email: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // Securely hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const newUser = await prisma.user.create({
      data: {
        orgId: org.id,
        email: body.email,
        passwordHash,
        role: body.role,
        employeeId: body.employeeId || null,
      },
      include: {
        employee: { select: { name: true, position: true, department: true } }
      }
    });

    // Remove hash from the response payload for security
    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: 'Failed to provision account' }, { status: 500 });
  }
}