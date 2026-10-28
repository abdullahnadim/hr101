import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET: Fetch all leave requests for the organization (Admin view)
export async function GET(request: Request) {
  const auth = await requirePermission('HR_HUB', 'READ');
  if (!auth.authorized) return auth.response;

  try {
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employee: { orgId: org.id }
      },
      include: {
        employee: { select: { name: true, employeeCode: true, department: true, position: true } },
        policy: { select: { name: true, isPaid: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
  }
}

// POST: Submit a new leave request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, policyId, leaveType, startDate, endDate, totalDays, reason } = body;

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields (employeeId, startDate, endDate)' }, { status: 400 });
    }

    // If no policyId is provided, find or create a default active leave policy
    let targetPolicyId = policyId;
    if (!targetPolicyId) {
      const defaultPolicy = await prisma.leavePolicy.findFirst({ where: { isActive: true } });
      if (defaultPolicy) {
        targetPolicyId = defaultPolicy.id;
      } else {
        // Create a fallback policy if none exists in the database
        const org = await prisma.organization.findFirst();
        if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        
        const newPolicy = await prisma.leavePolicy.create({
          data: {
            orgId: org.id,
            name: leaveType || 'General Leave',
            daysPerYear: 14,
            isPaid: true
          }
        });
        targetPolicyId = newPolicy.id;
      }
    }

    // Calculate total days if not provided
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const calculatedDays = totalDays || Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        policyId: targetPolicyId,
        leaveType: leaveType || 'Annual Leave',
        startDate: start,
        endDate: end,
        totalDays: calculatedDays,
        reason: reason || '',
        status: 'PENDING'
      },
      include: {
        employee: { select: { name: true, employeeCode: true, department: true } },
        policy: { select: { name: true, isPaid: true } }
      }
    });

    return NextResponse.json(newLeaveRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}

// PUT: Approve or Reject a leave request (Admin action)
export async function PUT(request: Request) {
  const auth = await requirePermission('HR_HUB', 'UPDATE');
  if (!auth.authorized) return auth.response;

  try {
    const { id, status, reviewerNotes } = await request.json();

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request payload or status' }, { status: 400 });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewerNotes: reviewerNotes || null
      },
      include: {
        employee: { select: { name: true, email: true } },
        policy: { select: { name: true } }
      }
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}