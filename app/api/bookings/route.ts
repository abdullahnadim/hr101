import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to convert "HH:MM" to total minutes for easy comparison
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, teamName, reason, date, startTime, durationMinutes, status, roomName, roomId } = body;

    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + parseInt(durationMinutes);

    // Fetch existing APPROVED bookings for this specific room and date
    const existingBookings = await prisma.roomBooking.findMany({
      where: {
        date: new Date(date),
        status: 'APPROVED',
        // Scope to exact roomId if available, fallback to string name for legacy rows
        OR: [
          ...(roomId ? [{ roomId }] : []),
          { roomName: roomName || 'FAL Conference Room' }
        ]
      }
    });

    let isConflict = false;
    for (const booking of existingBookings) {
      const existingStart = timeToMinutes(booking.startTime);
      const existingEnd = existingStart + booking.durationMinutes;

      if (newStart < existingEnd && newEnd > existingStart) {
        isConflict = true;
        break;
      }
    }

    const finalStatus = isConflict ? 'CONFLICT' : (status || 'PENDING');

    const newBooking = await prisma.roomBooking.create({
      data: {
        roomName: roomName || 'FAL Conference Room',
        roomId: roomId || null,
        employeeId,
        teamName,
        reason,
        date: new Date(date),
        startTime,
        durationMinutes: parseInt(durationMinutes),
        status: finalStatus
      }
    });

    return NextResponse.json({ 
      success: true, 
      booking: newBooking, 
      message: isConflict ? 'Time slot conflict detected for this room. Forwarded to Admin.' : 'Request processed successfully.' 
    }, { status: isConflict ? 409 : 201 });

  } catch (error) {
    console.error("Booking POST Error:", error);
    return NextResponse.json({ error: 'Failed to process booking request.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const bookings = await prisma.roomBooking.findMany({
      include: {
        employee: {
          select: { name: true, employeeCode: true, department: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Booking GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch bookings.' }, { status: 500 });
  }
}