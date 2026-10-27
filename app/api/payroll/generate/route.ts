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
    
    // Default settings with FY 2026-27 Tax bounds
    const settings = org?.payrollSettings || {
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
      
      const otherAllowances = totalConsolidatedGross - basicSalary - houseRent - medicalAllowance;

      // 3. Additional Top-Up Allowances
      const specificEmpAllowance = emp.allowance || 0; 
      const transportAllowance = emp.transportAllowance || 0;
      const mobileBillAllocated = emp.mobileBillLimit || 0; 

      const finalGrossEarnings = totalConsolidatedGross + specificEmpAllowance + transportAllowance;

      // ====================================================================
      // 4. BANGLADESH PROGRESSIVE TAX CALCULATION (FY 2026-27 Logic)
      // ====================================================================
      
      let calculatedMonthlyTax = 0;

      // Step A: Annualize Income (Using standard 13 multiplier for 12 months + 2 festival bonuses/1 full bonus equivalent)
      const annualIncome = finalGrossEarnings * 13; 

      // Step B: General Exemption (1/3rd of total income OR 450,000 Tk, whichever is lower)
      const oneThirdIncome = annualIncome / 3;
      const exemptedAmount = Math.min(oneThirdIncome, 450000);
      const taxableIncome = annualIncome - exemptedAmount;

      // Step C: Determine Employee Tax-Free Slab (Fallback to Male if gender not explicitly specified)
      const empData: any = emp.customData || {};
      const isFemaleOrElderly = empData.gender === 'Female' || empData.gender === 'Other';
      const taxFreeSlab = isFemaleOrElderly ? settings.taxFreeAmountFemale : settings.taxFreeAmountMale;

      if (taxableIncome > taxFreeSlab) {
        let remainingTaxable = taxableIncome - taxFreeSlab; // 0% on the first slab
        let grossTax = 0;

        // Progressive Slabs (Standard BD Rates)
        const taxSlabs = [
          { limit: 100000, rate: 0.05 }, // Next 1 Lakh @ 5%
          { limit: 300000, rate: 0.10 }, // Next 3 Lakh @ 10%
          { limit: 400000, rate: 0.15 }, // Next 4 Lakh @ 15%
          { limit: 500000, rate: 0.20 }, // Next 5 Lakh @ 20%
          { limit: 2000000, rate: 0.25 } // Next 20 Lakh @ 25%
        ];

        // Process Slabs
        for (const slab of taxSlabs) {
          if (remainingTaxable > 0) {
            const taxableAtThisSlab = Math.min(remainingTaxable, slab.limit);
            grossTax += taxableAtThisSlab * slab.rate;
            remainingTaxable -= taxableAtThisSlab;
          }
        }
        
        // Rest at 30%
        if (remainingTaxable > 0) {
          grossTax += remainingTaxable * 0.30; 
        }

        // Step D: Investment Rebate Calculation
        const maxAllowableInvestment = taxableIncome * (settings.allowableInvestmentCap / 100);
        const investmentRebate = maxAllowableInvestment * (settings.investmentRebatePercentage / 100);
        
        let netAnnualTax = grossTax - investmentRebate;

        // Step E: Minimum Tax Application
        const isDhaka = empData.location === 'Dhaka' || empData.city === 'Dhaka';
        const minimumTax = isDhaka ? settings.minimumTaxDhaka : settings.minimumTaxOther;
        
        const finalAnnualTax = Math.max(netAnnualTax, minimumTax);

        // Step F: Monthly Withholding Deduction
        calculatedMonthlyTax = finalAnnualTax / 12;
      }
      
      // If HR explicitly overrides the tax amount manually for a specific employee, use that instead.
      const taxDeduction = emp.taxAmount > 0 ? emp.taxAmount : calculatedMonthlyTax;
      // ====================================================================

      // 5. Other Deductions
      const transportDeduction = emp.usesCompanyTransport ? (emp.transportRouteFare || 0) : 0;
      
      let loanDeduction = 0;
      let advanceDeduction = 0;
      for (const loan of emp.loans) {
        if (loan.type === 'COMPANY_LOAN') loanDeduction += loan.emiAmount;
        if (loan.type === 'PRIME_AGRIM_ADVANCE') advanceDeduction += loan.emiAmount;
      }

      const totalDeductions = transportDeduction + taxDeduction + loanDeduction + advanceDeduction;
      const netPay = finalGrossEarnings - totalDeductions;

      // 6. Save Payslip
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