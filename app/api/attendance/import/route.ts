import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });

    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(',').map(col => col.trim()));
    const headers = rows[0].map(h => h.toLowerCase());
    
    const empCodeIdx = headers.indexOf('employeecode');
    const dateIdx = headers.indexOf('date');
    const statusIdx = headers.indexOf('status');

    if (empCodeIdx === -1 || dateIdx === -1 || statusIdx === -1) {
      return NextResponse.json({ error: "CSV must contain headers: employeeCode, date, status" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3 || !row[empCodeIdx]) continue;

      const code = row[empCodeIdx];
      const dateStr = row[dateIdx];
      const status = row[statusIdx]; // e.g., PRESENT, ABSENT_UNPAID, WEEKEND_WORK

      const employee = await prisma.employee.findUnique({ where: { employeeCode: code } });
      if (!employee) {
        errorCount++;
        continue;
      }

      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        errorCount++;
        continue;
      }

      // Upsert ensures we don't create duplicate attendance records for the same day
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: employee.id, date: parsedDate } },
        update: { status },
        create: { employeeId: employee.id, date: parsedDate, status }
      });
      
      successCount++;
    }

    return NextResponse.json({ success: true, imported: successCount, errors: errorCount });
  } catch (error) {
    console.error("CSV Import Error:", error);
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}