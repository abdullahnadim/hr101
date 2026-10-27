import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isWeekend = (date: Date, weekends: string[]) => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return weekends.includes(dayName);
};

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();
    if (!month || !year) return NextResponse.json({ error: 'Month and year required' }, { status: 400 });

    const org = await prisma.organization.findFirst({
      include: { payrollSettings: true }
    });
    
    // Default customizable breakdown settings
    const settings = org?.payrollSettings || {
      basicPercentage: 50,
      houseRentPercentageOfBasic: 50,
      medicalAllowanceFixed: 600,
      salaryCycleStartDay: 26,
      salaryCycleEndDay: 25,
      weekends: ["Friday", "Saturday"]
    };

    const startDate = new Date(year, month - 2, settings.salaryCycleStartDay);
    const endDate = new Date(year, month - 1, settings.salaryCycleEndDay);

    const holidays = await prisma.holiday.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });
    const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);

    let standardWorkingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!isWeekend(d, settings.weekends) && !holidayDates.includes(dateStr)) {
        standardWorkingDays++;
      }
    }

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { 
        loans: { where: { status: 'ACTIVE' } },
        attendances: { where: { date: { gte: startDate, lte: endDate } } }
      }
    });

    const generatedPayslips = [];

    for (const emp of employees) {
      let unpaidAbsences = 0;
      let extraWeekendWork = 0;

      for (const record of emp.attendances) {
        if (record.status === 'ABSENT_UNPAID') unpaidAbsences++;
        if (record.status === 'WEEKEND_WORK' || record.status === 'HOLIDAY_WORK') extraWeekendWork++;
      }

      const actualPayableDays = standardWorkingDays - unpaidAbsences + extraWeekendWork;
      const prorationFactor = standardWorkingDays > 0 ? (actualPayableDays / standardWorkingDays) : 1;
      
      // 1. Core Gross Salary (Prorated)
      const baseGross = (emp.baseSalary || 0) * prorationFactor;
      const increment = (emp.increment || 0) * prorationFactor;
      const totalConsolidatedGross = baseGross + increment;

      // 2. The Custom Salary Breakdown
      const basicSalary = totalConsolidatedGross * (settings.basicPercentage / 100);
      const houseRent = basicSalary * (settings.houseRentPercentageOfBasic / 100);
      const medicalAllowance = settings.medicalAllowanceFixed * prorationFactor;
      
      // "Others" is the remainder of the Gross
      const otherAllowances = totalConsolidatedGross - basicSalary - houseRent - medicalAllowance;

      // 3. Additional Top-Up Allowances
      const specificEmpAllowance = emp.allowance || 0; 
      const transportAllowance = emp.transportAllowance || 0;
      const mobileBillAllocated = emp.mobileBillLimit || 0; // Tracked but not paid in cash

      const finalGrossEarnings = totalConsolidatedGross + specificEmpAllowance + transportAllowance;

      // 4. Deductions
      const transportDeduction = emp.usesCompanyTransport ? (emp.transportRouteFare || 0) : 0;
      const taxDeduction = emp.taxAmount > 0 
        ? emp.taxAmount 
        : (totalConsolidatedGross * (emp.taxPercentage || 0)) / 100;
      
      let loanDeduction = 0;
      let advanceDeduction = 0;
      for (const loan of emp.loans) {
        if (loan.type === 'COMPANY_LOAN') loanDeduction += loan.emiAmount;
        if (loan.type === 'PRIME_AGRIM_ADVANCE') advanceDeduction += loan.emiAmount;
      }

      const totalDeductions = transportDeduction + taxDeduction + loanDeduction + advanceDeduction;
      const netPay = finalGrossEarnings - totalDeductions;

      const payslip = await prisma.payroll.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month: Number(month), year: Number(year) } },
        update: {
          grossSalary: finalGrossEarnings,
          basicSalary: basicSalary,
          houseRent: houseRent,
          medicalAllowance: medicalAllowance, 
          otherAllowances: otherAllowances + specificEmpAllowance,
          transportAllowance,
          transportDeduction,
          loanDeduction,
          advanceDeduction,
          mobileBillAllocated,
          netPay,
          taxDeduction,
          payableDays: actualPayableDays,
          standardWorkingDays: standardWorkingDays
        },
        create: {
          employeeId: emp.id,
          month: Number(month),
          year: Number(year),
          grossSalary: finalGrossEarnings,
          basicSalary: basicSalary,
          houseRent: houseRent,
          medicalAllowance: medicalAllowance,
          otherAllowances: otherAllowances + specificEmpAllowance,
          transportAllowance,
          transportDeduction,
          loanDeduction,
          advanceDeduction,
          mobileBillAllocated,
          netPay,
          taxDeduction,
          payableDays: actualPayableDays,
          standardWorkingDays: standardWorkingDays
        }
      });
      generatedPayslips.push(payslip);
    }

    return NextResponse.json({ success: true, count: generatedPayslips.length });
  } catch (error) {
    console.error("Error generating payroll:", error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}