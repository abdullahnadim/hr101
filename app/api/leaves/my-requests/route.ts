import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

const prisma = new PrismaClient();

// GET: Fetch the logged-in employee's leave history
export async function GET(request: Request) {
  try {
    // 1. Authenticate the user
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // TEMPORARY: For testing without auth, we will fetch the first user who has an employee profile
    const testUser = await prisma.user.findFirst({ where: { employeeId: { not: null } } });
    const employeeId = testUser?.employeeId; // Replace with: session.user.employeeId

    if (!employeeId) {
      return NextResponse.json({ error: 'No employee profile linked to this account.' }, { status: 403 });
    }

    // 2. Fetch their requests and include the policy details
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: employeeId },
      include: {
        policy: { select: { name: true, isPaid: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json({ error: 'Failed to fetch leave history' }, { status: 500 });
  }
}

// POST: Submit a new time-off request
export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const testUser = await prisma.user.findFirst({ where: { employeeId: { not: null } } });
    const employeeId = testUser?.employeeId; 

    if (!employeeId) {
      return NextResponse.json({ error: 'No employee profile linked to this account.' }, { status: 403 });
    }

    const body = await request.json();
    const { policyId, startDate, endDate, reason } = body;

    if (!policyId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Create the request with a default status of PENDING
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        policyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || '',
        status: 'PENDING'
      }
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error submitting leave request:", error);
    return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 });
  }
}