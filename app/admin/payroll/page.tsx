'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, Search, Filter, Loader2, DollarSign, 
  FileText, Download, CheckCircle2, TrendingUp, TrendingDown,
  Bus, Car
} from 'lucide-react';

export default function PayrollDashboard() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Default to current month/year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, you would create a GET route for /api/payroll to fetch these
      // For now, we will simulate fetching until we build the GET route
      const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) setPayslips(await res.json());
      else setPayslips([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

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
        alert(data.error);
      }
    } catch (error) {
      alert("Failed to run payroll cycle.");
    } finally {
      setGenerating(false);
    }
  };

  // Format currency
  const formatTk = (amount: number) => `৳${amount.toLocaleString('en-IN')}`;

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

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Controls */}
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
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : payslips.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20">
              <DollarSign size={48} className="text-neutral-200 mb-4" />
              <p className="font-medium text-neutral-900 mb-1">No payslips generated for this period.</p>
              <p className="text-sm">Click "Run Payroll Cycle" to calculate earnings and deductions.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Gross Salary</th>
                  <th className="px-6 py-4">Transport Allowance</th>
                  <th className="px-6 py-4">Route Deduction</th>
                  <th className="px-6 py-4">Other Deductions</th>
                  <th className="px-6 py-4">Net Pay</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payslips.map(ps => (
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
                        <TrendingUp size={14} /> +{formatTk(ps.transportAllowance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ps.transportDeduction > 0 ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit text-xs">
                          <Bus size={14} /> -{formatTk(ps.transportDeduction)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs italic">Own Commute</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(ps.loanDeduction + ps.advanceDeduction + ps.taxDeduction) > 0 ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit text-xs">
                          <TrendingDown size={14} /> -{formatTk(ps.loanDeduction + ps.advanceDeduction + ps.taxDeduction)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-black text-base">
                      {formatTk(ps.netPay)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-black hover:border-black transition-colors text-xs font-bold shadow-sm">
                        <Download size={14} /> Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}