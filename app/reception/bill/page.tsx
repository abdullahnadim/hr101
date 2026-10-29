'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Receipt, Calendar, Building2, DollarSign, Plus, Clock, 
  Search, Loader2, ArrowLeft, Edit2, Trash2, Download, 
  CheckSquare, Square, X, Send, AlertCircle, FileText, Save
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
  vendor: { name: string }; 
  user?: { name: string; email: string };
  recordedBy?: { name: string; employeeCode: string };
}

const BILL_CATEGORIES = ['Supplier/party bill', 'Salary', 'Overtime', 'Incentive', 'Other'];

// --- TIMELINE COMPONENT ---
const WorkflowTimeline = ({ bill }: { bill: BillEntry }) => {
  const formatTime = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const enteredBy = bill.recordedBy?.name || bill.user?.name || bill.user?.email?.split('@')[0] || 'System';

  return (
    <div className="mt-2.5 p-2 bg-neutral-50/80 rounded-md border border-neutral-100 shadow-inner w-full max-w-[220px]">
      <div className="flex flex-col gap-1.5">
        
        <div className="flex justify-between items-start gap-3 text-[9px] font-mono tracking-wider uppercase text-neutral-500">
          <span className="font-bold">Entry:</span> 
          <span className="text-right leading-tight">
            {formatTime(bill.entryAt)}<br/>
            <span className="text-[8px] text-neutral-400 capitalize normal-case">by {enteredBy}</span>
          </span>
        </div>

        {bill.accountsReceivedAt && (
          <div className="flex justify-between items-center gap-3 text-[9px] font-mono tracking-wider uppercase text-blue-600 border-t border-neutral-200 pt-1.5">
            <span className="font-bold">Accounts:</span> 
            <span>{formatTime(bill.accountsReceivedAt)}</span>
          </div>
        )}

        {bill.auditReceivedAt && (
          <div className="flex justify-between items-center gap-3 text-[9px] font-mono tracking-wider uppercase text-purple-600 border-t border-neutral-200 pt-1.5">
            <span className="font-bold">Audit:</span> 
            <span>{formatTime(bill.auditReceivedAt)}</span>
          </div>
        )}

        {bill.approvedAt && (
          <div className="flex justify-between items-center gap-3 text-[9px] font-mono tracking-wider uppercase text-emerald-600 border-t border-neutral-200 pt-1.5">
            <span className="font-bold">Approved:</span> 
            <span>{formatTime(bill.approvedAt)}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default function ReceptionBillLogBook() {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter & Export States
  const [filterMode, setFilterMode] = useState<'all' | 'month' | 'week' | 'custom'>('all');
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
  
  // Smart Autocomplete State
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

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- SELECTION HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBills.length) setSelectedIds([]);
    else setSelectedIds(filteredBills.map(b => b.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // --- WORKFLOW: SEND TO ACCOUNTS ---
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
    } catch (err) {
      alert("Failed to forward bills.");
    }
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} bill entries?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}`, { method: 'DELETE' });
      }
      setBills(bills.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Failed to delete selected bills.");
    }
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

  const handleCreateInlineVendor = async () => {
    if (!vendorSearch.trim()) return;
    try {
      const res = await fetch('/api/configuration/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vendorSearch })
      });
      if (res.ok) {
        const newVendor = await res.json();
        setVendors([...vendors, newVendor].sort((a, b) => a.name.localeCompare(b.name)));
        selectVendor(newVendor);
      }
    } catch (error) {
      alert("Failed to create vendor");
    }
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

  const filteredBills = bills.filter(bill => {
    const searchString = `${bill.vendor?.name} ${bill.billNumber} ${bill.systemSerialNo}`.toLowerCase();
    if (!searchString.includes(searchQuery.toLowerCase())) return false;
    
    const billDate = new Date(bill.billDate || bill.entryAt);

    if (filterMode === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      if (billDate.getFullYear() !== parseInt(year) || (billDate.getMonth() + 1) !== parseInt(month)) {
        return false;
      }
    }

    if (filterMode === 'week' && selectedWeek) {
      const targetYear = parseInt(selectedWeek.split('-W')[0]);
      const targetWeek = parseInt(selectedWeek.split('-W')[1]);
      const onejan = new Date(billDate.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((billDate.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      if (billDate.getFullYear() !== targetYear || weekNum !== targetWeek) return false;
    }

    if (filterMode === 'custom') {
      if (customStart && new Date(bill.billDate) < new Date(customStart)) return false;
      if (customEnd && new Date(bill.billDate) > new Date(customEnd)) return false;
    }

    return true;
  });

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
  const exactVendorMatch = vendors.find(v => v.name.toLowerCase() === vendorSearch.toLowerCase());

  // --- EXPORT TO EXCEL ---
  const handleExport = () => {
    const targetList = selectedIds.length > 0 
      ? bills.filter(b => selectedIds.includes(b.id))
      : filteredBills;

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

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'DRAFT': return <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider border border-neutral-200">Draft</span>;
      case 'SENT_TO_ACCOUNTS': return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100">In Accounts</span>;
      case 'DISCREPANCY': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 flex items-center gap-1"><AlertCircle size={10}/> Discrepancy</span>;
      case 'SENT_TO_AUDIT': return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-100">In Audit</span>;
      case 'APPROVED_FOR_DISBURSEMENT': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-100">Disbursement</span>;
      default: return null;
    }
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
            <Download size={16} /> Export Reports
          </button>
          <button onClick={openNewModal} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-800 shadow-sm active:scale-95 transition-all">
            <Plus size={16} /> New Bill Entry
          </button>
        </div>
      </div>

      {/* FR-02: Workflow Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200 border border-blue-800">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-white text-blue-900 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>draft entries selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSendToAccounts} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm border border-blue-500">
              <Send size={14} /> Send to Accounts
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm border border-red-500">
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-blue-300 hover:text-white px-2 py-1">Deselect All</button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <button onClick={() => setFilterMode('all')} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterMode === 'all' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>
              All Time
            </button>
            <button onClick={() => setFilterMode('month')} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterMode === 'month' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>
              Month-wise
            </button>
            <button onClick={() => setFilterMode('week')} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterMode === 'week' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>
              Week-wise
            </button>
            <button onClick={() => setFilterMode('custom')} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterMode === 'custom' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>
              Custom Dates
            </button>

            {filterMode === 'month' && (
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white font-mono" />
            )}

            {filterMode === 'week' && (
              <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white font-mono" />
            )}

            {filterMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs font-mono bg-white" />
                <span className="text-xs text-neutral-400">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-1.5 border border-neutral-200 rounded-lg text-xs font-mono bg-white" />
              </div>
            )}
          </div>
          
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search vendor, bill no, recorder..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black transition-shadow bg-white" />
          </div>
        </div>

        {/* Main Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-[400px] flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={28} /></div>
          ) : filteredBills.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400">
              <Receipt size={48} className="text-neutral-200 mb-4" />
              <p className="font-bold text-neutral-900">No records found</p>
              <p className="text-sm">There are no bills matching your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[11px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-black">
                      {selectedIds.length === filteredBills.length && filteredBills.length > 0 ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-6 py-4">Serial & Inv No</th>
                  <th className="px-6 py-4">Vendor & Category</th>
                  <th className="px-6 py-4">Date & Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBills.map(bill => {
                  const isSelected = selectedIds.includes(bill.id);
                  const enteredBy = bill.recordedBy?.name || bill.user?.name || bill.user?.email?.split('@')[0] || 'System User';

                  return (
                    <tr key={bill.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center">
                         {/* Only Drafts can be selected for sending */}
                        {bill.status === 'DRAFT' && (
                          <button onClick={() => toggleSelectOne(bill.id)} className="text-neutral-400 hover:text-black">
                            {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-neutral-900">{bill.systemSerialNo}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5 tracking-wider uppercase">Inv: {bill.billNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{bill.vendor?.name}</div>
                        <div className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">{bill.category}</div>
                        {bill.discrepancyNote && (
                          <div className="text-[10px] text-red-600 mt-1 flex items-start gap-1 max-w-[200px] truncate" title={bill.discrepancyNote}>
                            <AlertCircle size={12} className="shrink-0 mt-0.5"/> {bill.discrepancyNote}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-neutral-600 mb-2">
                          <Calendar size={14} className="text-neutral-400" />
                          {new Date(bill.billDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <StatusBadge status={bill.status} />
                        
                        {/* INJECTED WORKFLOW TIMELINE */}
                        <WorkflowTimeline bill={bill} />
                        
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-neutral-900 text-base">৳ {bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-neutral-400 font-normal italic mt-1">By: {enteredBy}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(bill.status === 'DRAFT' || bill.status === 'DISCREPANCY') && (
                          <button onClick={() => openEditModal(bill)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                <Download size={18} className="text-blue-600" /> Export Bill Logbook
              </h2>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 text-neutral-400 hover:text-black rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-neutral-600">
              <p>You are about to export bill records to Excel based on your current filters:</p>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 font-medium text-xs">
                <p>Filter Mode: <span className="text-black uppercase font-bold">{filterMode}</span></p>
                <p>Records targeted: <span className="text-black font-bold">{selectedIds.length > 0 ? `${selectedIds.length} (Selected rows)` : `${filteredBills.length} (Current filtered view)`}</span></p>
              </div>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg">Cancel</button>
              <button onClick={handleExport} className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 shadow-sm flex items-center gap-2">
                <Download size={14} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ENTRY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b bg-neutral-50 font-bold text-neutral-900 flex justify-between items-center">
              <h2 className="flex items-center gap-2"><Receipt size={18} className="text-blue-600"/> {editingBillId ? 'Correct Bill Entry' : 'Log Physical Bill'}</h2>
              {!editingBillId && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded uppercase tracking-wider">System Serial Auto-Gen</span>}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={14} /> Vendor Name / Payee</label>
                <input 
                  type="text" value={vendorSearch}
                  onChange={(e) => { setVendorSearch(e.target.value); setShowVendorDropdown(true); setFormData({ ...formData, vendorId: '' }); }}
                  onFocus={() => setShowVendorDropdown(true)}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none bg-white transition-colors"
                  placeholder="Select or type to add new..."
                />
                
                {showVendorDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredVendors.map(v => (
                      <button key={v.id} type="button" onClick={() => selectVendor(v)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors font-medium text-neutral-900 border-b border-neutral-100">
                        {v.name}
                      </button>
                    ))}
                    {vendorSearch && !exactVendorMatch && (
                      <button type="button" onClick={handleCreateInlineVendor} className="w-full text-left px-4 py-3 text-sm text-blue-700 bg-blue-50 font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 sticky bottom-0">
                        <Plus size={14} /> Create "{vendorSearch}"
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={14} /> Bill Category *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:border-black outline-none transition-colors">
                    {BILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Invoice/Bill No.</label>
                  <input type="text" value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none font-mono" placeholder="If applicable" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} /> Date on Bill *</label>
                  <input type="date" required value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:border-black outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} /> Amount (৳) *</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none bg-white font-mono" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Description / Purpose</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none transition-colors" placeholder="Optional notes for Accounts..." />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6 border-neutral-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !formData.vendorId} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 active:scale-95 shadow-sm">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingBillId ? 'Update & Resubmit' : 'Save Draft Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}