import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // 1. Secure the route with RBAC
  const auth = await requirePermission('HR_HUB', 'CREATE');
  if (!auth.authorized) return auth.response;

  try {
    const employees = await request.json(); 
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("Organization not found");

    const dataToInsert = employees.map((emp: any) => {
      // Safely parse date
      const rawDate = emp.joiningDate || emp['Date of Join'] || emp.joining_date;
      const parsedDate = new Date(rawDate);
      const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      // Extract ID (Fallback to generated if completely missing)
      const rawId = emp.employeeCode || emp['ID Card No'] || emp.employeecode || emp.employeeid || emp.id;
      const code = (rawId && String(rawId).trim() !== '') 
        ? String(rawId).trim() 
        : `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      // Extract Name
      const name = (emp.name || emp['Employee Name'] || 'Unknown').trim();

      // AUTO-GENERATE EMAIL: if missing, format name to name@fal.com.bd
      let safeEmail = emp.email || emp['Email'];
      if (!safeEmail || String(safeEmail).trim() === '') {
        // Replace spaces with dots and remove special characters
        const emailPrefix = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        safeEmail = `${emailPrefix || 'employee'}@fal.com.bd`;
      } else {
        safeEmail = String(safeEmail).trim();
      }

      return {
        orgId: org.id,
        employeeCode: code, 
        name: name,
        email: safeEmail,
        phone: emp.phone || emp['Mobile']?.toString() || 'N/A',
        position: emp.position || emp['Designation'] || 'Employee',
        department: emp.department || emp['Section'] || 'Unassigned', 
        gender: emp.gender || emp['Sex'] || null,
        bloodGroup: emp.bloodGroup || emp['Blood Group'] || null,
        joiningDate: safeDate,
        status: 'ACTIVE'
      };
    });

    // Efficient Bulk Insert (skips existing Employee IDs)
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