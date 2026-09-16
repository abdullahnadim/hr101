'use client';
import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

export default function CSVImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          for (const row of results.data as any[]) {
            // 1. Clean Phone: Keep the entire string to allow multiple numbers
            const rawPhone = String(row.phone || row.Phone || row.Contact || '').trim();
            const cleanPhone = rawPhone || 'No Phone';

            // 2. Clean Email: Use the specific placeholder if empty
            const rawEmail = String(row.email || row.Email || '').trim();
            const cleanEmail = rawEmail || 'Email not found';

            // 3. Clean Position: Assign a fallback if empty
            const cleanPosition = String(row.position || row.Position || row.Designation || '').trim() || 'Unspecified Role';

            // 4. Clean Department
            const cleanDepartment = String(row.department || row.Department || '').trim() || null;

            // 5. Capture Extra Columns into JSON Notes
            const extraFields = [];
            const empType = row['Employee Type'] || row['employee type'];
            if (empType) {
              extraFields.push({ key: 'Employee Type', value: String(empType).trim() });
            }
            const sl = row['SL'] || row['sl'];
            if (sl) {
              extraFields.push({ key: 'SL', value: String(sl).trim() });
            }

            await fetch('/api/candidates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: String(row.name || row.Name || 'Unknown Candidate').trim(),
                email: cleanEmail,
                phone: cleanPhone,
                position: cleanPosition,
                department: cleanDepartment,
                notes: extraFields.length > 0 ? JSON.stringify(extraFields) : null
              })
            });
          }
          onImportSuccess();
        } catch (error) {
          console.error("Import failed", error);
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
        {isUploading ? 'Importing...' : 'Import CSV'}
      </button>
    </>
  );
}