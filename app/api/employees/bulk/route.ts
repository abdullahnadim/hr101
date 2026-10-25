import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const employees = await request.json(); 
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organization not found");

    const dataToInsert = employees.map((emp: any) => {
      const rawDate = emp.joiningdate || emp.joining_date;
      const parsedDate = new Date(rawDate);
      const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      // Aggressively check for every CSV ID header variation
      const rawId = emp.employee || emp.employeecode || emp.employeeid || emp.id || emp.employee_id;
      
      const code = (rawId && String(rawId).trim() !== '') 
        ? String(rawId).trim() 
        : `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      // Pass null to the database if the email cell is blank
      const safeEmail = (emp.email && emp.email.trim() !== '') ? emp.email.trim() : null;

      return {
        orgId: org.id,
        employeeCode: code, 
        name: emp.name || 'Unknown',
        email: safeEmail,
        phone: emp.phone || 'N/A',
        position: emp.position || 'N/A',
        department: emp.department || emp.departme || 'N/A', 
        joiningDate: safeDate,
      };
    });

    const result = await prisma.employee.createMany({
      data: dataToInsert,
      skipDuplicates: true, 
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}