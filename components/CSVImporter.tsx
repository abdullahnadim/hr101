'use client';
import { useRef, useState, useEffect } from 'react';
import { Upload, Loader2, Download } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function CSVImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Connect to Settings
  const { customFields } = useSettingsStore();

  useEffect(() => setMounted(true), []);

  const baseHeaderMap: Record<string, string> = {
    'candidate': 'name', 'candidatename': 'name', 'name': 'name', 'fullname': 'name',
    'contact': 'phone', 'contactnumber': 'phone', 'phone': 'phone', 'mobile': 'phone',
    'role': 'position', 'designation': 'position', 'roledesignation': 'position', 'position': 'position', 'jobtitle': 'position',
    'department': 'department', 'dept': 'department',
    'email': 'email', 'emailaddress': 'email',
    'status': 'status', 'currentstatus': 'status',
    'employmenttype': 'employmentType', 'type': 'employmentType'
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        
        // 1. Map settings fields so the script recognizes them in the CSV header
        const dynamicHeaderMap = { ...baseHeaderMap };
        customFields.forEach((field: any) => {
          const cleanFieldLabel = field.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          dynamicHeaderMap[cleanFieldLabel] = field.label; // Maps to Exact Label Name
        });

        const headers = rows[0].split(',').map(h => {
          const cleanHeader = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          return dynamicHeaderMap[cleanHeader] || cleanHeader; 
        });
        
        // 2. Parse Data & Bundle Custom Fields into JSON
        const parsedData = rows.slice(1).map(row => {
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
          
          const candidate: any = {};
          const notesArr: any[] = [];
          
          headers.forEach((header, index) => {
            const val = values[index] || '';
            if (['name', 'email', 'phone', 'position', 'department', 'status'].includes(header)) {
              candidate[header] = val;
            } else if (header === 'employmentType') {
              notesArr.push({ key: 'Employment Type', value: val });
            } else if (customFields.some((f: any) => f.label === header)) {
              if (val) notesArr.push({ key: header, value: val }); // Pack dynamic CSV data into JSON
            }
          });
          
          if (notesArr.length > 0) candidate.notes = JSON.stringify(notesArr);
          if (!candidate.name) candidate.name = 'Unknown Candidate';
          if (!candidate.status) candidate.status = 'NEW';
          
          return candidate;
        });

        const res = await fetch('/api/candidates/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData)
        });

        if (res.ok) onImportSuccess();
        else alert('Failed to import candidates. Please check the format.');
      } catch (error) {
        alert('Error parsing CSV file. Please ensure it matches the standard template.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    // Generate the columns dynamically based on Settings
    const customHeaders = customFields.map((f: any) => f.label).join(',');
    const headers = `Candidate Name,Contact,Email,Role (Designation),Department,Status,Employment Type${customHeaders ? ',' + customHeaders : ''}\n`;
    
    // Provide a sample row that includes custom field examples
    const exampleValues = customFields.map((f: any) => f.type === 'select' && f.options ? f.options[0] : 'Sample ' + f.label).join(',');
    const example1 = `Mir Abdullah,01700000000,mir@example.com,Sr. Executive,Marketing,NEW,Regular Employee${exampleValues ? ',' + exampleValues : ''}\n`;
    
    const blob = new Blob([headers + example1], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "HR101_Dynamic_Import_Template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div className="flex gap-2 w-full md:w-auto">
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      
      <button onClick={downloadTemplate} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
        <Download size={16} /> Template
      </button>

      <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50">
        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {isImporting ? 'Importing...' : 'Import CSV'}
      </button>
    </div>
  );
}