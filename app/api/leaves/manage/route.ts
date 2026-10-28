import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET: Fetch ALL leave requests for the organization
export async function GET(request: Request) {
  // Require HR module read access
  const auth = await requirePermission('HR_HUB', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const requests = await prisma.leaveRequest.findMany({
      where: { 
        employee: { orgId: org.id } // Only fetch requests for this org
      },
      include: {
        employee: { select: { name: true, employeeCode: true, department: true, position: true } },
        policy: { select: { name: true, isPaid: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
  }
}

// PATCH: Approve or Reject a leave request
export async function PATCH(request: Request) {
  // Require HR module update access
  const auth = await requirePermission('HR_HUB', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const { id, status, reviewerNotes } = await request.json();

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { 
        status,
        reviewerNotes
      },
      include: {
        employee: { select: { name: true, email: true } },
        policy: { select: { name: true } }
      }
    });

    // FUTURE: Send email notification to employee here
    // if (updatedRequest.employee.email) {
    //    sendEmail(updatedRequest.employee.email, `Leave Request ${status}`);
    // }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}