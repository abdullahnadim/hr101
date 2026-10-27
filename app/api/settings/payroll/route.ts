import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({
      include: { payrollSettings: true }
    });

    if (!org) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    if (!org.payrollSettings) {
      const defaultSettings = await prisma.payrollSettings.create({
        data: {
          orgId: org.id,
          basicPercentage: 50,
          houseRentPercentageOfBasic: 50,
          medicalAllowanceFixed: 600,
          salaryCycleStartDay: 26,
          salaryCycleEndDay: 25,
          weekends: ["Friday", "Saturday"],
          taxFreeAmountMale: 400000,
          taxFreeAmountFemale: 450000,
          minimumTaxDhaka: 5000,
          minimumTaxOther: 3000,
          investmentRebatePercentage: 15,
          allowableInvestmentCap: 20
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(org.payrollSettings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst({ include: { payrollSettings: true } });
    
    if (!org) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const dataPayload = {
      basicPercentage: parseFloat(body.basicPercentage) || 50,
      houseRentPercentageOfBasic: parseFloat(body.houseRentPercentageOfBasic) || 50,
      medicalAllowanceFixed: parseFloat(body.medicalAllowanceFixed) || 600,
      salaryCycleStartDay: parseInt(body.salaryCycleStartDay) || 26,
      salaryCycleEndDay: parseInt(body.salaryCycleEndDay) || 25,
      weekends: body.weekends || ["Friday", "Saturday"],
      
      // Tax Fields
      taxFreeAmountMale: parseFloat(body.taxFreeAmountMale) || 400000,
      taxFreeAmountFemale: parseFloat(body.taxFreeAmountFemale) || 450000,
      minimumTaxDhaka: parseFloat(body.minimumTaxDhaka) || 5000,
      minimumTaxOther: parseFloat(body.minimumTaxOther) || 3000,
      investmentRebatePercentage: parseFloat(body.investmentRebatePercentage) || 15,
      allowableInvestmentCap: parseFloat(body.allowableInvestmentCap) || 20,
    };

    // Use Upsert so it creates the settings row if it doesn't exist yet
    const updatedSettings = await prisma.payrollSettings.upsert({
      where: { orgId: org.id },
      update: dataPayload,
      create: {
        orgId: org.id,
        ...dataPayload
      }
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}