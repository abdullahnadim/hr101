import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({
      include: { payrollSettings: true }
    });

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    if (!org.payrollSettings) {
      // Initialize default settings if none exist
      const defaultSettings = await prisma.payrollSettings.create({
        data: {
          orgId: org.id,
          basicPercentage: 50,
          houseRentPercentageOfBasic: 50,
          medicalAllowanceFixed: 600,
          salaryCycleStartDay: 26,
          salaryCycleEndDay: 25,
          weekends: ["Friday", "Saturday"]
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(org.payrollSettings);
  } catch (error) {
    console.error("Error fetching payroll settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst({ include: { payrollSettings: true } });
    
    if (!org) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const updatedSettings = await prisma.payrollSettings.update({
      where: { orgId: org.id },
      data: {
        basicPercentage: parseFloat(body.basicPercentage) || 50,
        houseRentPercentageOfBasic: parseFloat(body.houseRentPercentageOfBasic) || 50,
        medicalAllowanceFixed: parseFloat(body.medicalAllowanceFixed) || 600,
        salaryCycleStartDay: parseInt(body.salaryCycleStartDay) || 26,
        salaryCycleEndDay: parseInt(body.salaryCycleEndDay) || 25,
        weekends: body.weekends || ["Friday", "Saturday"]
      }
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating payroll settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}