'use client';
import { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Printer } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ExportCandidatesModal({ isOpen, onClose, selectedCandidates }: any) {
  const { customFields } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  
  // Base columns (Always exist)
  const [columns, setColumns] = useState<Record<string, boolean>>({
    name: true, phone: true, email: true, position: true, department: true, status: true, employmentType: true,
  });

  useEffect(() => {
    setMounted(true);
    // Dynamically inject custom fields into the export toggles
    if (customFields && customFields.length > 0) {
      setColumns(prev => {
        const next = { ...prev };
        customFields.forEach((f: any) => { 
          if (next[f.label] === undefined) next[f.label] = true; 
        });
        return next;
      });
    }
  }, [customFields]);

  if (!isOpen || !mounted) return null;

  const toggleColumn = (col: string) => setColumns(prev => ({ ...prev, [col]: !prev[col] }));
  const getActiveHeaders = () => Object.keys(columns).filter(k => columns[k]);
  
  const getHeaderLabel = (h: string) => {
    if (h === 'phone') return 'Contact';
    if (h === 'employmentType') return 'Employment Type';
    if (['name', 'email', 'position', 'department', 'status'].includes(h)) return h.charAt(0).toUpperCase() + h.slice(1);
    return h; // Returns Custom Field Label exactly as set in Settings
  };

  // Extracts data from standard columns OR parses the dynamic JSON notes
  const getCandidateValue = (candidate: any, header: string) => {
    if (['name', 'phone', 'email', 'position', 'department', 'status'].includes(header)) return candidate[header] || '';
    
    try {
      const notes = typeof candidate.notes === 'string' ? JSON.parse(candidate.notes) : candidate.notes;
      if (Array.isArray(notes)) {
        const targetKey = header === 'employmentType' ? 'Employment Type' : header;
        const found = notes.find((n: any) => n.key === targetKey);
        return found ? found.value : '';
      }
    } catch(e) { return ''; }
    return '';
  };

  const handleExportCSV = () => {
    if (!selectedCandidates || selectedCandidates.length === 0) return;
    const activeHeaders = getActiveHeaders();
    const headerRow = activeHeaders.map(getHeaderLabel).join(',');

    const rows = selectedCandidates.map((candidate: any) => {
      return activeHeaders.map(header => `"${String(getCandidateValue(candidate, header)).replace(/"/g, '""')}"`).join(',');
    });

    const blob = new Blob([[headerRow, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HR101_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handlePrint = () => {
    if (!selectedCandidates || selectedCandidates.length === 0) return;
    const activeHeaders = getActiveHeaders();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow pop-ups to print.");

    const html = `
      <!DOCTYPE html><html><head><title>HR101 Export</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #171717; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px; }
        h1 { font-size: 24px; margin: 0; }
        .meta { font-size: 12px; color: #525252; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background-color: #f5f5f5; text-align: left; padding: 10px; border: 1px solid #d4d4d4; font-weight: 600; text-transform: uppercase; font-size: 11px; }
        td { padding: 10px; border: 1px solid #e5e5e5; }
        tr:nth-child(even) { background-color: #fafafa; }
        @media print { @page { size: landscape; margin: 1cm; } body { padding: 0; } }
      </style></head>
      <body>
        <div class="header">
          <div><h1>Candidate Directory</h1><p class="meta">Exported: ${new Date().toLocaleDateString('en-GB')}</p></div>
          <div class="meta"><strong>${selectedCandidates.length}</strong> Listed</div>
        </div>
        <table>
          <thead><tr>${activeHeaders.map(h => `<th>${getHeaderLabel(h)}</th>`).join('')}</tr></thead>
          <tbody>${selectedCandidates.map((candidate: any) => `<tr>${activeHeaders.map(h => `<td>${getCandidateValue(candidate, h) || '-'}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-lg text-neutral-900">Export Details</h2>
            <p className="text-xs text-neutral-500 mt-1">{selectedCandidates?.length || 0} candidates selected</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 rounded-full border bg-white border-neutral-200"><X size={16} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-neutral-800 mb-3">Include Columns:</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {Object.entries(columns).map(([key, isSelected]) => (
              <label key={key} className="flex items-center gap-3 p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg cursor-pointer border border-transparent hover:border-neutral-200">
                <input type="checkbox" checked={isSelected} onChange={() => toggleColumn(key)} className="w-4 h-4 rounded text-black focus:ring-black accent-black" />
                <span className="text-sm text-neutral-700 capitalize font-medium truncate">{getHeaderLabel(key)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-neutral-100 bg-white sticky bottom-0">
          <div className="flex justify-end gap-3">
            <button onClick={handleExportCSV} className="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg flex items-center gap-2 shadow-sm"><FileSpreadsheet size={16} /> CSV</button>
            <button onClick={handlePrint} className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 flex items-center gap-2 shadow-md"><Printer size={16} /> PDF / Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}