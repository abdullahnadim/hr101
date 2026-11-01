'use client';
import { useState, useRef } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImportEmployeeButton({ onImportSuccess }: { onImportSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0]; 
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Mapped exactly to the headers in your provided image
        const mappedData = rawData
          .filter((row: any) => row['Employee ID'] || row['Employee Name']) 
          .map((row: any) => {
            let parsedGender = row['Sex']?.toString().trim();
            if (parsedGender === 'M') parsedGender = 'Male';
            if (parsedGender === 'F') parsedGender = 'Female';

            return {
              employeeCode: row['Employee ID']?.toString().trim(),
              name: row['Employee Name']?.toString().trim(),
              email: row['Email Address']?.toString().trim(), 
              gender: parsedGender,
              position: row['Designation']?.toString().trim(),
              department: row['Department']?.toString().trim(),
              phone: row['Mobile']?.toString().trim(),
              bloodGroup: row['Blood Group']?.toString().trim(),
              dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']).toISOString() : undefined,
              joiningDate: row['Date of Join'] ? new Date(row['Date of Join']).toISOString() : undefined,
              status: row['Status']?.toString().trim().toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              
              // Apply basic defaults for required payroll fields not in the sheet
              baseSalary: 0,
              mobileBillLimit: 0,
              transportRouteFare: 0,
            };
          });

        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedData)
        });

        const result = await res.json();
        if (res.ok) {
          alert(`Import Complete!\nSuccessfully imported new records: ${result.count}`);
          onImportSuccess(); // Refresh the parent table
        } else {
          alert(result.error || "Failed to process import.");
        }
      } catch (error) {
        console.error(error);
        alert("Error parsing Excel file. Check format.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={importing} 
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {importing ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <FileSpreadsheet size={16} className="text-emerald-600" />} 
        {importing ? 'Processing...' : 'Bulk Import'}
      </button>
    </>
  );
}