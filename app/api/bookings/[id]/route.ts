import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // NEW: Await the params Promise required in Next.js 15+
    const resolvedParams = await params;
    const { status, startTime } = await request.json();
    
    const updateData: any = { status };
    if (startTime) {
      updateData.startTime = startTime;
    }

    const updatedBooking = await prisma.roomBooking.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}