'use client';
import { useState } from 'react';
import { UploadCloud, Loader2, FileText, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function AttendanceImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/attendance/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ imported: data.imported, errors: data.errors });
        setFile(null);
      } else {
        setErrorMsg(data.error || 'Upload failed.');
      }
    } catch (error) {
      setErrorMsg('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Absent & Attendance Uploader</h1>
        <p className="text-neutral-500 mt-1">Upload your Jibika-exported CSV to log daily attendance, leaves, and absences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Upload Panel */}
        <div className="md:col-span-2 bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 h-fit">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 p-10 transition-colors hover:bg-neutral-100">
            <UploadCloud size={48} className="text-neutral-400 mb-4" />
            <h3 className="font-bold text-neutral-900 text-lg">Select CSV File</h3>
            <p className="text-sm text-neutral-500 mt-1 text-center max-w-sm mb-6">
              Headers required: <span className="font-mono text-black font-bold">employeeCode</span>, <span className="font-mono text-black font-bold">date</span>, and <span className="font-mono text-black font-bold">status</span>.
            </p>
            
            <label className="cursor-pointer bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-neutral-800 transition-colors">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <p className="font-bold text-blue-900 text-sm">{file.name}</p>
                  <p className="text-xs text-blue-600/80">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} Process File
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-emerald-600" size={24} />
                <h3 className="font-bold text-emerald-900 text-lg">Import Complete</h3>
              </div>
              <div className="space-y-1 pl-9 text-sm font-medium text-emerald-800">
                <p>Successfully processed: <span className="font-black">{result.imported}</span> records</p>
                {result.errors > 0 && <p className="text-red-600">Failed/Skipped: <span className="font-black">{result.errors}</span> records</p>}
              </div>
            </div>
          )}
        </div>

        {/* Accepted Jibika Status Codes Guide */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-blue-600" />
            <h3 className="font-bold text-blue-900">Valid Status Codes</h3>
          </div>
          <p className="text-xs text-blue-800 mb-4">Your CSV <span className="font-mono font-bold">status</span> column must use these exact codes to render correctly on the Master Salary Sheet:</p>
          <ul className="space-y-2 text-sm text-neutral-700 font-medium">
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">PRESENT</span> <span>Present (PR)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">ABSENT</span> <span>Absent (AB)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">LATE</span> <span>Late Days (LD)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">WEEKLY_HOLIDAY</span> <span>Weekly (WH)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">FESTIVAL_HOLIDAY</span> <span>Festival (FH)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">CASUAL_LEAVE</span> <span>Casual (CL)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">SICK_LEAVE</span> <span>Sick (SL)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">EARNED_LEAVE</span> <span>Earned (EL)</span></li>
            <li className="flex justify-between items-center"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-700">MATERNITY_LEAVE</span> <span>Maternity (ML)</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}