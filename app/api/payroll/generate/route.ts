import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, year } = body;

    // 1. Fetch global payroll settings (Ensure you have a record created in the DB for this)
    const org = await prisma.organization.findFirst({
      include: { payrollSettings: true }
    });
    
    if (!org || !org.payrollSettings) {
      // Fallback defaults if settings haven't been saved via the UI yet
      org!.payrollSettings = {
        transportAllowance: 3500,
        basicPercentage: 60,
        houseRentPercentage: 30,
        medicalPercentage: 10
      } as any;
    }

    const settings = org!.payrollSettings;

    // 2. Fetch all ACTIVE employees and their ACTIVE loans
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { loans: { where: { status: 'ACTIVE' } } }
    });

    const generatedPayslips = [];

    // 3. Calculate Payslip for each employee
    for (const emp of employees) {
      
      // -- EARNINGS --
      const basicSalary = (emp.baseSalary * settings!.basicPercentage) / 100;
      const houseRent = (emp.baseSalary * settings!.houseRentPercentage) / 100;
      const medicalAllowance = (emp.baseSalary * settings!.medicalPercentage) / 100;
      const transportAllowance = settings!.transportAllowance;

      // -- DEDUCTIONS --
      // If they use official transport, deduct their specific route fare from their gross
      const transportDeduction = emp.usesCompanyTransport ? emp.transportRouteFare : 0;
      
      let loanDeduction = 0;
      let advanceDeduction = 0;
      
      for (const loan of emp.loans) {
        if (loan.type === 'COMPANY_LOAN') loanDeduction += loan.emiAmount;
        if (loan.type === 'PRIME_AGRIM_ADVANCE') advanceDeduction += loan.emiAmount;
      }

      // -- TOTALS --
      const grossEarnings = basicSalary + houseRent + medicalAllowance + transportAllowance;
      const totalDeductions = transportDeduction + loanDeduction + advanceDeduction;
      const netPay = grossEarnings - totalDeductions;

      // 4. Save to Database (Uses upsert to overwrite if regenerating the same month)
      const payslip = await prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year
          }
        },
        update: {
          grossSalary: emp.baseSalary,
          basicSalary, houseRent, medicalAllowance, transportAllowance,
          transportDeduction, loanDeduction, advanceDeduction,
          mobileBillAllocated: emp.mobileBillLimit,
          netPay
        },
        create: {
          employeeId: emp.id,
          month, year,
          grossSalary: emp.baseSalary,
          basicSalary, houseRent, medicalAllowance, transportAllowance,
          transportDeduction, loanDeduction, advanceDeduction,
          mobileBillAllocated: emp.mobileBillLimit,
          netPay
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