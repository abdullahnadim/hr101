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
    const { employeeId, teamName, reason, date, startTime, durationMinutes, status } = body;

    // 1. Calculate the start and end time in minutes for the new request
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + parseInt(durationMinutes);

    // 2. Fetch all APPROVED bookings for this specific date
    const existingBookings = await prisma.roomBooking.findMany({
      where: {
        date: new Date(date),
        status: 'APPROVED',
      }
    });

    // 3. Collision Detection Math
    let isConflict = false;
    for (const booking of existingBookings) {
      const existingStart = timeToMinutes(booking.startTime);
      const existingEnd = existingStart + booking.durationMinutes;

      // Overlap formula: (Start A < End B) and (End A > Start B)
      if (newStart < existingEnd && newEnd > existingStart) {
        isConflict = true;
        break;
      }
    }

    // 4. Save the request. If there's a conflict, flag it. Otherwise use the requested status (allows admin/ATS auto-approve).
    const finalStatus = isConflict ? 'CONFLICT' : (status || 'PENDING');

    const newBooking = await prisma.roomBooking.create({
      data: {
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
      message: isConflict ? 'Time slot conflict detected. Forwarded to Admin for resolution.' : 'Request processed successfully.' 
    });

  } catch (error) {
    console.error("Booking POST Error:", error);
    return NextResponse.json({ error: 'Failed to process booking request.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Fetch all bookings (to populate the calendar and the admin queue)
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