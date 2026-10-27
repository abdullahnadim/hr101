import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const employeeId = searchParams.get('employeeId');

    const whereClause: any = {};
    if (month) whereClause.month = Number(month);
    if (year) whereClause.year = Number(year);
    if (employeeId) whereClause.employeeId = employeeId;

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { name: true, employeeCode: true, department: true }
        }
      },
      orderBy: {
        employee: { name: 'asc' }
      }
    });

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error("Error fetching payroll data:", error);
    return NextResponse.json({ error: 'Failed to fetch payroll records' }, { status: 500 });
  }
}