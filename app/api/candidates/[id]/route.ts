import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; 
    const data = await request.json();
    
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        position: data.position,
        status: data.status,
      }
    });

    // If location is provided and an interview exists, update the link
    if (data.location !== undefined) {
      await prisma.interview.updateMany({
        where: { candidateId: id },
        data: { location: data.location }
      });
    }

    return NextResponse.json(updatedCandidate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Delete associated interviews first to avoid foreign key constraint errors
    await prisma.interview.deleteMany({
      where: { candidateId: id }
    });
    
    // Delete the candidate
    await prisma.candidate.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}