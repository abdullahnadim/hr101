'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Receipt, Calendar, Building2, DollarSign, Plus, Clock, 
  Search, Loader2, ArrowLeft, Edit2, Trash2, Download, 
  CheckSquare, Square, X, Send, AlertCircle, FileText, Save,
  MoreHorizontal, ChevronRight, UserCircle, CheckCircle2, CircleDashed
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Vendor { id: string; name: string; }
interface BillEntry {
  id: string;
  systemSerialNo: string;
  billNumber: string;
  entryAt: string;
  billDate: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  discrepancyNote?: string;
  accountsReceivedAt?: string;
  auditReceivedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  vendor: { name: string }; 
  user?: { name: string; email: string };
  recordedBy?: { name: string; employeeCode: string };
  approvedBy?: { name: string };
}

const BILL_CATEGORIES = ['Supplier/party bill', 'Salary', 'Overtime', 'Incentive', 'Other'];

// --- PREMIUM STATUS BADGE ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200/60',
    SENT_TO_ACCOUNTS: 'bg-blue-50 text-blue-700 border-blue-200/60',
    DISCREPANCY: 'bg-red-50 text-red-700 border-red-200/60',
    SENT_TO_AUDIT: 'bg-purple-50 text-purple-700 border-purple-200/60',
    APPROVED_FOR_DISBURSEMENT: 'bg-teal-50 text-teal-700 border-teal-200/60',
    DISBURSED: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  };

  const labels: Record<string, string> = {
    DRAFT: 'Draft Entry',
    SENT_TO_ACCOUNTS: 'In Accounts',
    DISCREPANCY: 'Discrepancy',
    SENT_TO_AUDIT: 'In Audit',
    APPROVED_FOR_DISBURSEMENT: 'Approved',
    DISBURSED: 'Disbursed',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${styles[status] || styles.DRAFT}`}>
      {status === 'DISCREPANCY' && <AlertCircle size={10} strokeWidth={3} />}
      {status === 'DISBURSED' && <CheckCircle2 size={10} strokeWidth={3} />}
      {labels[status] || status}
    </span>
  );
};

// --- SLEEK COMPACT TIMELINE ---
const CompactTimeline = ({ bill }: { bill: BillEntry }) => {
  const formatTime = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const enteredBy = bill.recordedBy?.name || bill.user?.name || bill.user?.email?.split('@')[0] || 'System User';
  const approverName = bill.approvedBy?.name || 'Authorized Signatory';

  return (
    <div className="flex flex-col gap-2 mt-3 border-l-2 border-neutral-100 pl-3 ml-1 relative">
      {/* Entry Step */}
      <div className="relative">
        <div className="absolute -left-[17px] top-[5px] w-2 h-2 rounded-full bg-neutral-300 ring-4 ring-white"></div>
        <p className="text-[10px] text-neutral-500 leading-tight">
          <span className="font-bold text-neutral-700">Submitted:</span> {formatTime(bill.entryAt)}<br/>
          <span className="italic">by {enteredBy}</span>
        </p>
      </div>

      {/* Approval Step */}
      {(bill.approvedAt || bill.status === 'APPROVED_FOR_DISBURSEMENT' || bill.status === 'DISBURSED') && (
        <div className="relative">
          <div className="absolute -left-[17px] top-[5px] w-2 h-2 rounded-full bg-teal-400 ring-4 ring-white"></div>
          <p className="text-[10px] text-neutral-500 leading-tight">
            <span className="font-bold text-teal-700">Approved:</span> {bill.approvedAt ? formatTime(bill.approvedAt) : 'Pending Date'}<br/>
            {bill.approvedAt && <span className="italic">by {approverName}</span>}
          </p>
        </div>
      )}

      {/* Disbursement Step */}
      {(bill.disbursedAt || bill.status === 'DISBURSED') && (
        <div className="relative">
          <div className="absolute -left-[17px] top-[5px] w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white"></div>
          <p className="text-[10px] text-neutral-500 leading-tight">
            <span className="font-bold text-emerald-700">Disbursed:</span> {bill.disbursedAt ? formatTime(bill.disbursedAt) : 'Pending Date'}
          </p>
        </div>
      )}
    </div>
  );
};


export default function ReceptionBillLogBook() {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'month' | 'week' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'disbursed'>('all');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedWeek, setSelectedWeek] = useState(''); 
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [formData, setFormData] = useState({ vendorId: '', billDate: '', amount: '', category: 'Supplier/party bill', description: '', billNumber: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/reception/bills').then(res => res.ok ? res.json() : []),
      fetch('/api/configuration/vendors').then(res => res.ok ? res.json() : [])
    ]).then(([billsData, vendorsData]) => {
      setBills(Array.isArray(billsData) ? billsData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
      setLoading(false);
    }).catch(error => {
      console.error("Fetch error:", error);
      setBills([]); setVendors([]); setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBills.length) setSelectedIds([]);
    else setSelectedIds(filteredBills.map(b => b.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSendToAccounts = async () => {
    if (!confirm(`Forward ${selectedIds.length} bills to Accounts for checking?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}/status`, { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT_TO_ACCOUNTS' })
        });
      }
      setBills(bills.map(b => selectedIds.includes(b.id) ? { ...b, status: 'SENT_TO_ACCOUNTS', accountsReceivedAt: new Date().toISOString() } : b));
      setSelectedIds([]);
      alert("Successfully forwarded to Accounts.");
    } catch (err) { alert("Failed to forward bills."); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} bill entries?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}`, { method: 'DELETE' });
      }
      setBills(bills.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch (err) { alert("Failed to delete selected bills."); }
  };

  const openNewModal = () => {
    setEditingBillId(null);
    setFormData({ vendorId: '', billDate: new Date().toISOString().split('T')[0], amount: '', category: 'Supplier/party bill', description: '', billNumber: '' });
    setVendorSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (bill: BillEntry) => {
    if (bill.status !== 'DRAFT' && bill.status !== 'DISCREPANCY') {
      return alert("Cannot edit a bill that is already under review by Accounts/Audit. Corrections must be requested.");
    }
    setEditingBillId(bill.id);
    const matchedVendor = vendors.find(v => v.name === bill.vendor?.name);
    setFormData({
      vendorId: matchedVendor?.id || '',
      billDate: bill.billDate.split('T')[0],
      amount: bill.amount.toString(),
      category: bill.category,
      description: bill.description || '',
      billNumber: bill.billNumber || ''
    });
    setVendorSearch(bill.vendor?.name || '');
    setIsModalOpen(true);
  };

  const selectVendor = (vendor: Vendor) => {
    setFormData({ ...formData, vendorId: vendor.id });
    setVendorSearch(vendor.name);
    setShowVendorDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) return alert("Please select a vendor.");
    
    setSubmitting(true);
    const isEditing = !!editingBillId;
    const url = isEditing ? `/api/reception/bills/${editingBillId}` : '/api/reception/bills';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) })
      });
      
      if (res.ok) {
        const savedBill = await res.json();
        if (isEditing) setBills(bills.map(b => b.id === editingBillId ? savedBill : b));
        else setBills([savedBill, ...bills]);
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save entry.");
      }
    } catch (error) { alert("A network error occurred."); } finally { setSubmitting(false); }
  };

  // --- COMPREHENSIVE FILTERING ENGINE ---
  const filteredBills = bills.filter(bill => {
    // 1. Text Search Filter
    const searchString = `${bill.vendor?.name} ${bill.billNumber} ${bill.systemSerialNo}`.toLowerCase();
    if (!searchString.includes(searchQuery.toLowerCase())) return false;
    
    // 2. Status Filter
    if (statusFilter === 'pending') {
      if (!['DRAFT', 'SENT_TO_ACCOUNTS', 'DISCREPANCY', 'SENT_TO_AUDIT'].includes(bill.status)) return false;
    } else if (statusFilter === 'disbursed') {
      if (!['APPROVED_FOR_DISBURSEMENT', 'DISBURSED'].includes(bill.status)) return false;
    }

    // 3. Date Filter
    const billDate = new Date(bill.billDate || bill.entryAt);
    if (dateFilterMode === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      if (billDate.getFullYear() !== parseInt(year) || (billDate.getMonth() + 1) !== parseInt(month)) return false;
    }
    if (dateFilterMode === 'week' && selectedWeek) {
      const targetYear = parseInt(selectedWeek.split('-W')[0]);
      const targetWeek = parseInt(selectedWeek.split('-W')[1]);
      const onejan = new Date(billDate.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((billDate.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      if (billDate.getFullYear() !== targetYear || weekNum !== targetWeek) return false;
    }
    if (dateFilterMode === 'custom') {
      if (customStart && new Date(bill.billDate) < new Date(customStart)) return false;
      if (customEnd && new Date(bill.billDate) > new Date(customEnd)) return false;
    }
    return true;
  });

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));

  const handleExport = () => {
    const targetList = selectedIds.length > 0 ? bills.filter(b => selectedIds.includes(b.id)) : filteredBills;
    const formattedData = targetList.map((bill, index) => {
      const enteredBy = bill.recordedBy?.name || bill.user?.name || bill.user?.email?.split('@')[0] || 'System User';
      return {
        'SL': index + 1,
        'Bill No': bill.billNumber || 'N/A',
        'System Serial': bill.systemSerialNo,
        'Vendor Name': bill.vendor?.name || 'N/A',
        'Invoice Date': new Date(bill.billDate).toLocaleDateString(),
        'System Entry At': new Date(bill.entryAt).toLocaleString(),
        'Category': bill.category,
        'Amount (৳)': bill.amount,
        'Status': bill.status,
        'Entered By': enteredBy
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bill Logbook");
    XLSX.writeFile(workbook, `Reception_Bills_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-none space-y-6 animate-in fade-in duration-300 pb-24">
      
      <Link href="/reception" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
        <ArrowLeft size={16} /> Back to Hub
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={24} /> Financial Bill Logbook
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Track physical vendor invoices and manage the approval workflow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={openNewModal} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-800 shadow-md active:scale-95 transition-all">
            <Plus size={16} /> New Bill Entry
          </button>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200 border border-neutral-800">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-white text-neutral-900 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>draft entries selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSendToAccounts} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm border border-blue-500">
              <Send size={14} /> Send to Accounts
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm border border-red-500">
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-neutral-400 hover:text-white px-2 py-1 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* PREMIUM SaaS LIST VIEW */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Sleek Intelligent Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-neutral-50/30">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
            
            {/* Status Filters */}
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60 shrink-0">
              {[
                { id: 'all', label: 'All Bills' }, 
                { id: 'pending', label: 'Pending / Drafts' }, 
                { id: 'disbursed', label: 'Approved / Disbursed' }
              ].map(f => (
                <button 
                  key={f.id} onClick={() => setStatusFilter(f.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === f.id ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="hidden lg:block w-px h-6 bg-neutral-200 shrink-0"></div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 shrink-0">
              {['all', 'month', 'week', 'custom'].map((mode) => (
                <button 
                  key={mode} onClick={() => setDateFilterMode(mode as any)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize ${
                    dateFilterMode === mode ? 'bg-neutral-900 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {mode === 'all' ? 'All Time' : mode}
                </button>
              ))}
              
              {/* Dynamic Date Inputs */}
              {dateFilterMode === 'month' && <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white font-mono ml-1" />}
              {dateFilterMode === 'week' && <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white font-mono ml-1" />}
              {dateFilterMode === 'custom' && (
                <div className="flex items-center gap-1.5 ml-2">
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs font-mono bg-white" />
                  <span className="text-xs text-neutral-400 font-medium">to</span>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs font-mono bg-white" />
                </div>
              )}
            </div>

          </div>
          
          {/* Search Bar */}
          <div className="relative w-full xl:w-72 shrink-0">
            <Search className="absolute left-3.5 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-900 transition-colors bg-white shadow-sm" />
          </div>
        </div>

        {/* --- GRID LIST VIEW --- */}
        <div className="flex-1 bg-white">
          {loading ? (
            <div className="h-[400px] flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={28} /></div>
          ) : filteredBills.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                <Receipt size={24} className="text-neutral-400" />
              </div>
              <p className="font-bold text-neutral-900 text-lg">No records found</p>
              <p className="text-sm mt-1">Adjust your filters or enter a new bill.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {/* Desktop Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50/80 text-[10px] font-bold uppercase tracking-widest text-neutral-500 sticky top-0 z-10 border-b border-neutral-200">
                <div className="col-span-1 text-center">Select</div>
                <div className="col-span-3">Vendor & Identity</div>
                <div className="col-span-3 text-left">Invoice Details</div>
                <div className="col-span-2 text-right">Amount (৳)</div>
                <div className="col-span-2 pl-8">Timeline & Status</div> {/* MOVED TO END */}
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* List Rows */}
              {filteredBills.map(bill => {
                const isSelected = selectedIds.includes(bill.id);
                
                return (
                  <div key={bill.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-5 lg:px-6 items-start lg:items-center transition-all group border-l-2 ${isSelected ? 'bg-blue-50/30 border-blue-500' : 'bg-white border-transparent hover:border-neutral-200'}`}>
                    
                    {/* 1. Select Box */}
                    <div className="col-span-1 hidden lg:flex justify-center items-center">
                      {bill.status === 'DRAFT' ? (
                        <button onClick={() => toggleSelectOne(bill.id)} className={`transition-colors p-1 rounded ${isSelected ? 'text-blue-600 bg-blue-100/50' : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100'}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center opacity-30"><CircleDashed size={18} className="text-neutral-300" /></div>
                      )}
                    </div>

                    {/* 2. Vendor & Identity */}
                    <div className="col-span-1 lg:col-span-3">
                      <div className="flex items-center gap-3">
                        {/* Mobile select checkbox */}
                        <div className="lg:hidden shrink-0">
                           {bill.status === 'DRAFT' && (
                             <button onClick={() => toggleSelectOne(bill.id)} className={isSelected ? 'text-blue-600' : 'text-neutral-300'}><CheckSquare size={18} /></button>
                           )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-neutral-500" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-neutral-900 text-sm truncate">{bill.vendor?.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded tracking-wider">{bill.systemSerialNo}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Invoice Details */}
                    <div className="col-span-1 lg:col-span-3 pl-12 lg:pl-0 flex flex-col justify-center">
                      <div className="font-mono text-xs font-bold text-neutral-800">
                        {new Date(bill.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                        {bill.category}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        Inv: {bill.billNumber || 'N/A'}
                      </div>
                    </div>

                    {/* 4. Amount */}
                    <div className="col-span-1 lg:col-span-2 text-left lg:text-right pl-12 lg:pl-0 flex flex-col justify-center">
                      <div className="text-lg font-black text-neutral-900 tracking-tight">
                        ৳ {bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* 5. Timeline & Status (MOVED TO RIGHT) */}
                    {/* 5. Timeline & Status (MOVED TO RIGHT) */}
<div className="col-span-1 lg:col-span-2 pl-12 lg:pl-8 flex flex-col justify-center items-start">
  <StatusBadge status={bill.status} />
  
  {/* FIX: Explicitly render Accounts' discrepancy comments! */}
  {bill.discrepancyNote && (
    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md text-[10px] text-red-700 font-medium leading-tight max-w-full">
      <div className="flex items-start gap-1.5">
        <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-600" />
        <span className="italic">{bill.discrepancyNote}</span>
      </div>
    </div>
  )}

  <CompactTimeline bill={bill} />
</div>

                    {/* 6. Action */}
                    <div className="col-span-1 lg:col-span-1 flex justify-end absolute lg:relative right-4 top-4 lg:right-0 lg:top-0">
                      {(bill.status === 'DRAFT' || bill.status === 'DISCREPANCY') ? (
                        <button onClick={() => openEditModal(bill)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm bg-white lg:bg-transparent lg:shadow-none" title="Edit">
                          <Edit2 size={16} />
                        </button>
                      ) : (
                        <div className="p-2 text-neutral-300 hidden lg:block" title="Locked"><MoreHorizontal size={16} /></div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                <Download size={18} className="text-blue-600" /> Export Bill Logbook
              </h2>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 text-neutral-400 hover:text-black rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-neutral-600">
              <p>You are about to export bill records to Excel based on your current filters:</p>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 font-medium text-xs">
                <p className="flex justify-between"><span>Date Filter:</span> <span className="text-black uppercase font-bold">{dateFilterMode}</span></p>
                <p className="flex justify-between"><span>Status Filter:</span> <span className="text-black uppercase font-bold">{statusFilter}</span></p>
                <p className="flex justify-between border-t border-neutral-200 pt-2"><span>Targeted Export:</span> <span className="text-blue-600 font-bold text-sm">{selectedIds.length > 0 ? `${selectedIds.length} Rows` : `${filteredBills.length} Rows`}</span></p>
              </div>
            </div>
            <div className="px-6 py-5 bg-neutral-50/50 border-t border-neutral-100 flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleExport} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 shadow-md active:scale-95 transition-all flex items-center gap-2">
                <Download size={14} /> Generate Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ENTRY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-5 border-b bg-neutral-50/50 flex justify-between items-center">
              <h2 className="font-extrabold text-neutral-900 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Receipt size={16}/></div>
                {editingBillId ? 'Update Bill Entry' : 'Log Physical Bill'}
              </h2>
              {!editingBillId && <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-widest">Serial Auto-Gen</span>}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={14} className="text-neutral-400" /> Vendor / Payee Name *</label>
                <input 
                  type="text" value={vendorSearch}
                  onChange={(e) => { setVendorSearch(e.target.value); setShowVendorDropdown(true); setFormData({ ...formData, vendorId: '' }); }}
                  onFocus={() => setShowVendorDropdown(true)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black outline-none bg-neutral-50/50 focus:bg-white transition-colors"
                  placeholder="Select or type to search..."
                />
                
                {showVendorDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map(v => (
                        <button key={v.id} type="button" onClick={() => selectVendor(v)} className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors font-semibold text-neutral-900 border-b border-neutral-50 last:border-0 flex items-center justify-between group">
                          {v.name}
                          <ChevronRight size={14} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    ) : (
                      <div className="w-full text-left px-4 py-4 text-sm text-neutral-500 italic bg-neutral-50/50 flex items-start gap-2">
                        <AlertCircle size={16} className="text-neutral-400 shrink-0 mt-0.5"/>
                        <span>No vendor found. Please ask Admin/HR to add this vendor to the directory.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={14} className="text-neutral-400" /> Category *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm bg-neutral-50/50 focus:bg-white focus:border-black outline-none transition-colors">
                    {BILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Invoice / Bill No.</label>
                  <input type="text" value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black outline-none font-mono bg-neutral-50/50 focus:bg-white transition-colors" placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-neutral-400" /> Date on Bill *</label>
                  <input type="date" required value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black outline-none font-mono bg-neutral-50/50 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} className="text-neutral-400" /> Amount (৳) *</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black outline-none font-mono bg-neutral-50/50 focus:bg-white transition-colors text-lg" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Description / Purpose</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black outline-none resize-none bg-neutral-50/50 focus:bg-white transition-colors" placeholder="Optional notes for Accounts review..." />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t mt-6 border-neutral-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !formData.vendorId} className="px-6 py-3 text-sm font-bold bg-black text-white rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95 shadow-md hover:shadow-lg">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingBillId ? 'Update Record' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}