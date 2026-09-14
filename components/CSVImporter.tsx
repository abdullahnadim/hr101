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
          // Send parsed rows to your API
          // Note: In production, use a bulk insert API route instead of a loop
          for (const row of results.data as any[]) {
            await fetch('/api/candidates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: row.name || row.Name || 'Unknown',
                email: row.email || row.Email || '',
                phone: row.phone || row.Phone || '',
                position: row.position || row.Position || 'Unspecified',
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