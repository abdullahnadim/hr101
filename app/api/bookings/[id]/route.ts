import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise required in Next.js 15+
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
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise required in Next.js 15+
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const deletedBooking = await prisma.roomBooking.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking successfully deleted.',
      booking: deletedBooking,
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking.' },
      { status: 500 }
    );
  }
}