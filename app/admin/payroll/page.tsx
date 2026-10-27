'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Calculator, Search, Loader2, DollarSign, 
  FileText, Download, TrendingUp, TrendingDown, X, Printer, TableProperties
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function PayrollContent() {
  const searchParams = useSearchParams();
  const preSelectedEmployee = searchParams.get('employeeId');

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null); 
  const [showMasterSheet, setShowMasterSheet] = useState(false); // Toggle for Jibika format
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/payroll?month=${selectedMonth}&year=${selectedYear}`;
      if (preSelectedEmployee) url += `&employeeId=${preSelectedEmployee}`;
      
      const res = await fetch(url);
      if (res.ok) setPayslips(await res.json());
      else setPayslips([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, preSelectedEmployee]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const handleGeneratePayroll = async () => {
    if (!confirm(`Are you sure you want to run payroll for ${selectedMonth}/${selectedYear}?`)) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated ${data.count} payslips!`);
        fetchPayslips();
      } else alert(data.error || "Failed to generate payroll");
    } catch (error) { alert("Failed to run payroll cycle."); } 
    finally { setGenerating(false); }
  };

  const formatTk = (amount: number) => (amount || 0).toLocaleString('en-IN');

  const filteredPayslips = payslips.filter(ps => 
    ps.employee?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ps.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by department for the Master Sheet
  const groupedByDept = filteredPayslips.reduce((acc, ps) => {
    const dept = ps.employee?.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(ps);
    return acc;
  }, {} as Record<string, any[]>);

  // --- Jibika Master Sheet Renderer ---
  if (showMasterSheet) {
    return (
      <div className="min-h-screen bg-white">
        {/* Print Controls (Hidden when printing) */}
        <div className="print:hidden sticky top-0 bg-neutral-900 text-white p-4 flex justify-between items-center shadow-md z-50">
          <div className="flex items-center gap-3">
            <TableProperties size={20} />
            <span className="font-bold">General Monthly Salary Sheet With OT - {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'short' })} {selectedYear}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold flex items-center gap-2">
              <Printer size={16} /> Print Sheet
            </button>
            <button onClick={() => setShowMasterSheet(false)} className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-bold flex items-center gap-2">
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* The Printable Master Sheet (Jibika Format) */}
        <div className="p-8 w-full min-w-[1200px] text-[10px] text-black font-sans print:p-0 print:text-[8px]">
          <div className="text-center mb-6">
            <h1 className="text-lg font-black uppercase">FAL Head office (Tongi)</h1>
            <h2 className="text-sm font-semibold">General Monthly Salary Sheet With OT Month of {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'short' })}-{selectedYear}</h2>
          </div>

          <table className="w-full border-collapse border border-neutral-800">
            <thead className="bg-[#e2efef] text-center font-bold">
              <tr>
                <th className="border border-neutral-800 p-1" rowSpan={2}>SL</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>ID Card No</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Employee Name<br/>Joining Date</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Designation<br/>Grade</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Pay<br/>Day</th>
                <th className="border border-neutral-800 p-1" colSpan={6}>Monthly Wages</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Gross<br/>Pay</th>
                <th className="border border-neutral-800 p-1" colSpan={5}>Deduction</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Salary<br/>Amount</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Arrear<br/>Amt</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Trans.<br/>Allow</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Payable<br/>Wages</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Net<br/>Payable</th>
                <th className="border border-neutral-800 p-1" rowSpan={2}>Tin No</th>
                <th className="border border-neutral-800 p-1 min-w-[80px]" rowSpan={2}>Signature<br/>Bank Ac No</th>
              </tr>
              <tr>
                <th className="border border-neutral-800 p-1">Basic</th>
                <th className="border border-neutral-800 p-1">H. Rent</th>
                <th className="border border-neutral-800 p-1">Medical</th>
                <th className="border border-neutral-800 p-1">Food</th>
                <th className="border border-neutral-800 p-1">Others</th>
                <th className="border border-neutral-800 p-1">Gross</th>
                
                <th className="border border-neutral-800 p-1">Adva.</th>
                <th className="border border-neutral-800 p-1">Stamp</th>
                <th className="border border-neutral-800 p-1">Tax</th>
                <th className="border border-neutral-800 p-1">Oth Ded</th>
                <th className="border border-neutral-800 p-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByDept).map(([dept, slips]) => (
                <React.Fragment key={dept}>
                  {/* Department Header Row */}
                  <tr>
                    <td colSpan={23} className="border border-neutral-800 p-1 font-bold bg-neutral-100 text-left underline">
                      Department: {dept}
                    </td>
                  </tr>
                  
                  {slips.map((ps, index) => {
                    const totalDed = (ps.advanceDeduction || 0) + (ps.taxDeduction || 0) + (ps.transportDeduction || 0) + (ps.loanDeduction || 0) + 10; // +10 for revenue stamp example
                    const totalDays = ps.standardWorkingDays || 30;
                    
                    return (
                      <tr key={ps.id} className="text-center align-top">
                        <td className="border border-neutral-800 p-1 font-semibold">{index + 1}</td>
                        <td className="border border-neutral-800 p-1 font-semibold">{ps.employee?.employeeCode}</td>
                        <td className="border border-neutral-800 p-1 text-left">
                          <div className="font-bold">{ps.employee?.name}</div>
                          <div className="text-[9px] text-neutral-600 mt-1">{new Date(ps.employee?.createdAt).toLocaleDateString('en-GB')}</div>
                        </td>
                        <td className="border border-neutral-800 p-1">
                          <div className="font-bold">{ps.employee?.position || 'N/A'}</div>
                          <div className="text-[9px] mt-1 font-bold bg-neutral-100 border border-neutral-300 w-full mt-2">
                             <table className="w-full text-[7px] text-center border-collapse">
                               <tbody>
                                 <tr>
                                   <td className="border border-neutral-300">PR</td><td className="border border-neutral-300">WH</td>
                                   <td className="border border-neutral-300">FH</td><td className="border border-neutral-300">CL</td>
                                   <td className="border border-neutral-300">SL</td><td className="border border-neutral-300">EL</td>
                                   <td className="border border-neutral-300">ML</td><td className="border border-neutral-300">AB</td>
                                   <td className="border border-neutral-300">LD</td>
                                 </tr>
                                 <tr>
                                   <td className="border border-neutral-300">{ps.payableDays || totalDays}</td>
                                   <td className="border border-neutral-300">4</td><td className="border border-neutral-300">0</td>
                                   <td className="border border-neutral-300">0</td><td className="border border-neutral-300">0</td>
                                   <td className="border border-neutral-300">0</td><td className="border border-neutral-300">0</td>
                                   <td className="border border-neutral-300 text-red-600 font-bold">{totalDays - (ps.payableDays || totalDays)}</td>
                                   <td className="border border-neutral-300">0</td>
                                 </tr>
                               </tbody>
                             </table>
                          </div>
                        </td>
                        <td className="border border-neutral-800 p-1 font-bold">{ps.payableDays || totalDays}</td>
                        <td className="border border-neutral-800 p-1">{formatTk(ps.basicSalary)}</td>
                        <td className="border border-neutral-800 p-1">{formatTk(ps.houseRent)}</td>
                        <td className="border border-neutral-800 p-1">{formatTk(ps.medicalAllowance)}</td>
                        <td className="border border-neutral-800 p-1">0</td>
                        <td className="border border-neutral-800 p-1">{formatTk(ps.otherAllowances)}</td>
                        <td className="border border-neutral-800 p-1 font-bold">{formatTk(ps.grossSalary)}</td>
                        
                        <td className="border border-neutral-800 p-1 font-bold">{formatTk(ps.grossSalary)}</td>
                        
                        <td className="border border-neutral-800 p-1">{formatTk(ps.advanceDeduction)}</td>
                        <td className="border border-neutral-800 p-1">10</td> {/* Stamp */}
                        <td className="border border-neutral-800 p-1">{formatTk(ps.taxDeduction)}</td>
                        <td className="border border-neutral-800 p-1">{formatTk((ps.transportDeduction || 0) + (ps.loanDeduction || 0))}</td>
                        <td className="border border-neutral-800 p-1 font-bold">{formatTk(totalDed)}</td>
                        
                        <td className="border border-neutral-800 p-1 font-bold">{formatTk(ps.grossSalary)}</td>
                        <td className="border border-neutral-800 p-1">0</td>
                        <td className="border border-neutral-800 p-1">{formatTk(ps.transportAllowance)}</td>
                        <td className="border border-neutral-800 p-1 font-bold">{formatTk(ps.netPay - 10)}</td>
                        <td className="border border-neutral-800 p-1 font-bold bg-[#f7fdfd]">{formatTk(ps.netPay - 10)}</td>
                        <td className="border border-neutral-800 p-1"></td>
                        <td className="border border-neutral-800 p-1 text-[8px] text-left">
                          <div className="h-6"></div>
                          {ps.employee?.bankAccount || ''}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  // --- End Master Sheet ---

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Payroll Processing</h1>
          <p className="text-neutral-500 mt-1">Generate payslips, track deductions, and process monthly salaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowMasterSheet(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <TableProperties size={16} /> Salary Sheet
          </button>
          <button 
            onClick={handleGeneratePayroll} 
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />} 
            Run Cycle
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-white border border-neutral-200 text-sm font-bold rounded-lg px-4 py-2 outline-none">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-white border border-neutral-200 text-sm font-bold rounded-lg px-4 py-2 outline-none">
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search employee..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : filteredPayslips.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20">
              <DollarSign size={48} className="text-neutral-200 mb-4" />
              <p className="font-medium text-neutral-900 mb-1">No payslips found.</p>
              <p className="text-sm">Click "Run Cycle" to generate them.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Gross Earnings</th>
                  <th className="px-6 py-4">Allowances</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Pay</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPayslips.map(ps => {
                  const totalAllowances = (ps.medicalAllowance || 0) + (ps.transportAllowance || 0) + (ps.mobileBillAllocated || 0);
                  const totalDeductions = (ps.transportDeduction || 0) + (ps.taxDeduction || 0) + (ps.loanDeduction || 0) + (ps.advanceDeduction || 0);

                  return (
                    <tr key={ps.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{ps.employee?.name || 'Unknown'}</div>
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">{ps.employee?.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-700">৳{formatTk(ps.grossSalary)}</td>
                      <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded w-fit text-xs"><TrendingUp size={14} /> +৳{formatTk(totalAllowances)}</span></td>
                      <td className="px-6 py-4">
                        {totalDeductions > 0 ? <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit text-xs"><TrendingDown size={14} /> -৳{formatTk(totalDeductions)}</span> : <span className="text-neutral-400 text-xs italic">-</span>}
                      </td>
                      <td className="px-6 py-4 font-black text-black text-base">৳{formatTk(ps.netPay)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedPayslip(ps)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-black font-bold text-xs"><Download size={14} /> PDF</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Individual Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2">
                <FileText className="text-black" size={20} />
                <h3 className="font-bold text-neutral-900">Payslip - {selectedMonth}/{selectedYear}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold"><Printer size={14} /> Print</button>
                <button onClick={() => setSelectedPayslip(null)} className="p-1.5 text-neutral-400 hover:text-black"><X size={18} /></button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 text-sm text-neutral-800">
              <h2 className="text-xl font-black text-neutral-900">FASHION ASIA LIMITED</h2>
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div><span className="text-xs text-neutral-400 block">Name</span><span className="font-bold">{selectedPayslip.employee?.name}</span></div>
                <div><span className="text-xs text-neutral-400 block">ID</span><span className="font-mono font-semibold">{selectedPayslip.employee?.employeeCode}</span></div>
              </div>
              <div className="bg-black text-white p-5 rounded-xl flex justify-between items-center">
                <div><p className="text-xs font-bold uppercase text-neutral-400">Net Take-Home Pay</p><p className="text-2xl font-black">৳{formatTk(selectedPayslip.netPay)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayrollDashboard() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin" size={24} /></div>}>
      <PayrollContent />
    </Suspense>
  );
}