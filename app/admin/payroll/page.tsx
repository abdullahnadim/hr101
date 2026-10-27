'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Calculator, Search, Filter, Loader2, DollarSign, 
  FileText, Download, TrendingUp, TrendingDown, Bus, X, Printer
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function PayrollContent() {
  const searchParams = useSearchParams();
  const preSelectedEmployee = searchParams.get('employeeId');

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null); // For PDF/Payslip Modal view
  
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
      if (res.ok) {
        setPayslips(await res.json());
      } else {
        setPayslips([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, preSelectedEmployee]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleGeneratePayroll = async () => {
    if (!confirm(`Are you sure you want to run payroll for ${selectedMonth}/${selectedYear}? This will calculate net pay for all active employees.`)) return;
    
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
      } else {
        alert(data.error || "Failed to generate payroll");
      }
    } catch (error) {
      alert("Failed to run payroll cycle.");
    } finally {
      setGenerating(false);
    }
  };

  const formatTk = (amount: number) => `৳${(amount || 0).toLocaleString('en-IN')}`;

  const filteredPayslips = payslips.filter(ps => 
    ps.employee?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ps.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Payroll Processing</h1>
          <p className="text-neutral-500 mt-1">Generate payslips, track deductions, and process monthly salaries.</p>
        </div>
        <button 
          onClick={handleGeneratePayroll} 
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />} 
          Run Payroll Cycle
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Controls Bar */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-neutral-200 text-sm font-bold rounded-lg px-4 py-2 outline-none cursor-pointer focus:border-black"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-neutral-200 text-sm font-bold rounded-lg px-4 py-2 outline-none cursor-pointer focus:border-black"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : filteredPayslips.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20">
              <DollarSign size={48} className="text-neutral-200 mb-4" />
              <p className="font-medium text-neutral-900 mb-1">No payslips found.</p>
              <p className="text-sm">Adjust your search or click "Run Payroll Cycle".</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Gross Earnings</th>
                  <th className="px-6 py-4">Allowances</th>
                  <th className="px-6 py-4">Transport/Tax</th>
                  <th className="px-6 py-4">Loans/Advances</th>
                  <th className="px-6 py-4">Net Pay</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPayslips.map(ps => {
                  const totalAllowances = (ps.medicalAllowance || 0) + (ps.transportAllowance || 0) + (ps.mobileBillAllocated || 0);
                  const totalDeductions = (ps.transportDeduction || 0) + (ps.taxDeduction || 0);
                  const totalLoans = (ps.loanDeduction || 0) + (ps.advanceDeduction || 0);

                  return (
                    <tr key={ps.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{ps.employee?.name || 'Unknown'}</div>
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">{ps.employee?.employeeCode || 'ID Pending'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-700">
                        {formatTk(ps.grossSalary)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded w-fit text-xs">
                          <TrendingUp size={14} /> +{formatTk(totalAllowances)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {totalDeductions > 0 ? (
                          <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit text-xs">
                            <TrendingDown size={14} /> -{formatTk(totalDeductions)}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">No Deductions</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {totalLoans > 0 ? (
                          <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit text-xs">
                            <TrendingDown size={14} /> -{formatTk(totalLoans)}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-black text-base">
                        {formatTk(ps.netPay)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPayslip(ps)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-black hover:border-black transition-colors text-xs font-bold shadow-sm"
                        >
                          <Download size={14} /> PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payslip PDF / Printable Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2">
                <FileText className="text-black" size={20} />
                <h3 className="font-bold text-neutral-900">Payslip Preview - {new Date(0, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-sm text-neutral-800">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
                <div>
                  <h2 className="text-xl font-black text-neutral-900">FASHION ASIA LIMITED</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Official Salary Statement & Payslip</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Statement Period</p>
                  <p className="font-semibold text-neutral-900">{selectedPayslip.month}/{selectedPayslip.year}</p>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Employee Name</span>
                  <span className="font-bold text-neutral-900 text-base">{selectedPayslip.employee?.name}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Employee ID / Code</span>
                  <span className="font-mono font-semibold text-neutral-700">{selectedPayslip.employee?.employeeCode}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Department / Position</span>
                  <span className="font-semibold text-neutral-700">{selectedPayslip.employee?.department || 'N/A'} - {selectedPayslip.employee?.position || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Payable Days</span>
                  <span className="font-semibold text-neutral-700">{selectedPayslip.payableDays ?? 'Full Month'} / {selectedPayslip.standardWorkingDays ?? '30'} Days</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-100 px-4 py-2.5 font-bold text-xs uppercase text-neutral-600 tracking-wider">Earnings</div>
                  <div className="divide-y divide-neutral-100 p-4 space-y-2">
                    <div className="flex justify-between"><span>Basic Salary</span> <span className="font-semibold">{formatTk(selectedPayslip.basicSalary)}</span></div>
                    <div className="flex justify-between"><span>House Rent</span> <span className="font-semibold">{formatTk(selectedPayslip.houseRent)}</span></div>
                    <div className="flex justify-between"><span>Medical Allowance</span> <span className="font-semibold">{formatTk(selectedPayslip.medicalAllowance)}</span></div>
                    <div className="flex justify-between"><span>Transport Allowance</span> <span className="font-semibold">{formatTk(selectedPayslip.transportAllowance)}</span></div>
                    <div className="flex justify-between"><span>Other Allowances</span> <span className="font-semibold">{formatTk(selectedPayslip.otherAllowances)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold text-neutral-900">
                      <span>Gross Salary</span> <span>{formatTk(selectedPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-100 px-4 py-2.5 font-bold text-xs uppercase text-neutral-600 tracking-wider">Deductions</div>
                  <div className="divide-y divide-neutral-100 p-4 space-y-2">
                    <div className="flex justify-between"><span>Transport Deduction</span> <span className="font-semibold text-red-600">-{formatTk(selectedPayslip.transportDeduction)}</span></div>
                    <div className="flex justify-between"><span>Tax Deduction</span> <span className="font-semibold text-red-600">-{formatTk(selectedPayslip.taxDeduction)}</span></div>
                    <div className="flex justify-between"><span>Company Loan EMI</span> <span className="font-semibold text-red-600">-{formatTk(selectedPayslip.loanDeduction)}</span></div>
                    <div className="flex justify-between"><span>Advance Deduction</span> <span className="font-semibold text-red-600">-{formatTk(selectedPayslip.advanceDeduction)}</span></div>
                    <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold text-neutral-900">
                      <span>Total Deductions</span> <span className="text-red-600">-{formatTk((selectedPayslip.transportDeduction || 0) + (selectedPayslip.taxDeduction || 0) + (selectedPayslip.loanDeduction || 0) + (selectedPayslip.advanceDeduction || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="bg-black text-white p-5 rounded-xl flex justify-between items-center shadow-md">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Net Take-Home Pay</p>
                  <p className="text-2xl font-black">{formatTk(selectedPayslip.netPay)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-neutral-800 rounded-full text-emerald-400">
                    {selectedPayslip.status || 'GENERATED'}
                  </span>
                </div>
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