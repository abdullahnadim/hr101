import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // In a real app, you would get the orgId from the authenticated user's session
    const org = await prisma.organization.findFirst(); 
    
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const candidates = await prisma.candidate.findMany({
      where: { orgId: org.id },
      include: { interview: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(candidates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const org = await prisma.organization.findFirst();
    
    if (!org) throw new Error('No org found');

    const newCandidate = await prisma.candidate.create({
      data: {
        ...data,
        orgId: org.id,
      }
    });
    
    return NextResponse.json(newCandidate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}