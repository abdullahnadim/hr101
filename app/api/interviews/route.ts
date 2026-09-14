import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { schedules } = await request.json();

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Invalid schedule data' }, { status: 400 });
    }

    // Create a single, flat array of un-awaited Prisma operations
    const operations = schedules.flatMap((schedule: any) => [
      // 1. Upsert the interview
      prisma.interview.upsert({
        where: { candidateId: schedule.candidateId },
        update: {
          date: new Date(schedule.date),
          startTime: schedule.startTime,
          durationMinutes: parseInt(schedule.durationMinutes),
          type: schedule.type,
          location: schedule.location, 
        },
        create: {
          candidateId: schedule.candidateId,
          date: new Date(schedule.date),
          startTime: schedule.startTime,
          durationMinutes: parseInt(schedule.durationMinutes),
          type: schedule.type,
          location: schedule.location,
        }
      }),
      
      // 2. Update the candidate status
      prisma.candidate.update({
        where: { id: schedule.candidateId },
        data: { status: 'SCHEDULED' }
      })
    ]);

    // Run all operations safely in one transaction block
    await prisma.$transaction(operations);

    return NextResponse.json({ success: true, count: schedules.length });
  } catch (error) {
    console.error("Scheduling error:", error);
    return NextResponse.json({ error: 'Failed to save schedules' }, { status: 500 });
  }
}