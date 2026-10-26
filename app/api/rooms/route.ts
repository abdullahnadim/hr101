import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const newRoom = await prisma.room.create({
      data: {
        orgId: org.id,
        name: body.name,
        capacity: Number(body.capacity),
        amenities: body.amenities, // Array of strings stored as JSON or String[] depending on your DB
        status: body.status || 'ACTIVE'
      }
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}