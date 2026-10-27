import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const assets = await prisma.iTAsset.findMany({
      include: {
        assignedTo: {
          select: { name: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching IT assets:", error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const newAsset = await prisma.iTAsset.create({
      data: {
        orgId: org.id,
        name: body.name,
        category: body.category,
        serialNumber: body.serialNumber || null,
        condition: body.condition || 'NEW',
        status: body.status || 'AVAILABLE',
        notes: body.notes || null,
        location: body.location || null,
        ipAddress: body.ipAddress || null,
        specs: body.specs ? (typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs) : undefined,
        credentials: body.credentials ? JSON.stringify(body.credentials) : null,
      },
      include: { assignedTo: true }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error("Error creating IT asset:", error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}