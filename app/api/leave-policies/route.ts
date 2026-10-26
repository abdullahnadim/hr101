import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const policies = await prisma.leavePolicy.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(policies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const newPolicy = await prisma.leavePolicy.create({
      data: {
        orgId: org.id,
        name: body.name,
        daysPerYear: Number(body.daysPerYear),
        isPaid: body.isPaid,
        carryForward: body.carryForward,
        maxCarryForward: Number(body.maxCarryForward || 0),
        isActive: true
      }
    });

    return NextResponse.json(newPolicy, { status: 201 });
  } catch (error) {
    console.error("Error creating leave policy:", error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}