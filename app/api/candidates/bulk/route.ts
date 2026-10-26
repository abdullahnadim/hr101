import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const candidates = await request.json();

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'No candidate data provided.' }, { status: 400 });
    }

    // 1. Automatically fetch your primary Organization from the database
    // Note: If your table is named differently (e.g., tenant or company), change `organization` below
    const defaultOrg = await prisma.organization.findFirst();
    
    if (!defaultOrg) {
       return NextResponse.json({ error: 'No organization found in the database.' }, { status: 400 });
    }

    // 2. Inject the REAL orgId from your database into every candidate
    const candidatesWithOrg = candidates.map(candidate => ({
      ...candidate,
      orgId: defaultOrg.id 
    }));

    // 3. Insert all candidates safely
    const result = await prisma.candidate.createMany({
      data: candidatesWithOrg,
      skipDuplicates: true, 
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.count} candidates.`,
      count: result.count
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import candidates to the database.' },
      { status: 500 }
    );
  }
}