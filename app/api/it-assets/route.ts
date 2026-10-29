import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = await requirePermission('IT_ASSETS', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const assets = await prisma.iTAsset.findMany({
      where: { orgId: org.id },
      include: {
        assignedTo: { select: { name: true, employeeCode: true, department: true } }
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
  const auth = await requirePermission('IT_ASSETS', 'CREATE');
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const initialNote = `[${new Date().toISOString().split('T')[0]}] Asset registered in system.`;
    
    // Automatically determine status based on assignment
    const isAssigned = !!body.assignedToId;
    const finalStatus = isAssigned ? 'ASSIGNED' : (body.status || 'AVAILABLE');
    const finalNote = isAssigned 
      ? `${initialNote}\n[${new Date().toISOString().split('T')[0]}] Assigned upon creation.` 
      : initialNote;

    const newAsset = await prisma.iTAsset.create({
      data: {
        orgId: org.id,
        name: body.name.trim(),
        category: body.category,
        serialNumber: body.serialNumber || null,
        condition: body.condition || 'NEW',
        status: finalStatus,
        notes: body.notes ? `${finalNote}\n${body.notes}` : finalNote,
        location: body.location || null,
        ipAddress: body.ipAddress || null,
        assignedToId: body.assignedToId || null, // NEW: Save the assignment
        specs: body.specs ? (typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs) : undefined,
        credentials: body.credentials ? JSON.stringify(body.credentials) : null,
      },
      include: { 
        // Ensure the frontend gets the employee details immediately
        assignedTo: { select: { name: true, employeeCode: true, department: true } } 
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error("Error creating IT asset:", error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}