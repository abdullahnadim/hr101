import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET() {
  // Ensure the user has HR access
  const auth = await requirePermission('HR_HUB', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { name: true, employeeCode: true, department: true, position: true, profileImage: true } // adjust if profileImage is stored differently
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Ensure the user has permission to UPDATE HR data (Approve/Reject)
  const auth = await requirePermission('HR_HUB', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const { id, status, reviewerNotes } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewerNotes }
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}

// Optional POST route if HR needs to manually input a leave request on behalf of an employee
export async function POST(request: Request) {
  const auth = await requirePermission('HR_HUB', 'CREATE');
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    
    const newLeave = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays: data.totalDays,
        reason: data.reason,
        status: data.status || 'PENDING'
      }
    });

    return NextResponse.json(newLeave);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}