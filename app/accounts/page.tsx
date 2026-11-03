'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, Search, Loader2, Send, AlertCircle, 
  CheckCircle2, Clock, CheckSquare, Square, X, ArrowRight, ShieldAlert,
  Building2, ChevronRight, UserCircle, Receipt, CircleDashed, Banknote
} from 'lucide-react';
import Link from 'next/link';

interface BillEntry {
  id: string;
  systemSerialNo: string;
  billNumber: string;
  entryAt: string;
  billDate: string;
  amount: number;
  category: string;
  department: string;
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

// --- PREMIUM STATUS BADGE ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    SENT_TO_ACCOUNTS: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    APPROVED_FOR_DISBURSEMENT: 'bg-amber-50 text-amber-700 border-amber-200/60',
    DISBURSED: 'bg-teal-50 text-teal-700 border-teal-200/60',
  };

  const labels: Record<string, string> = {
    SENT_TO_ACCOUNTS: 'Pending Review',
    APPROVED_FOR_DISBURSEMENT: 'Ready to Pay',
    DISBURSED: 'Paid',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${styles[status] || 'bg-neutral-100 text-neutral-600'}`}>
      {status === 'DISBURSED' && <CheckCircle2 size={10} strokeWidth={3} />}
      {labels[status] || status}
    </span>
  );
};

// --- SLEEK COMPACT TIMELINE ---
const CompactTimeline = ({ bill }: { bill: BillEntry }) => {
  const formatTime = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const enteredBy = bill.recordedBy?.name || bill.user?.name || bill.user?.email?.split('@')[0] || 'System User';

  return (
    <div className="flex flex-col gap-2 mt-3 border-l-2 border-neutral-100 pl-3 ml-1 relative">
      <div className="relative">
        <div className="absolute -left-[17px] top-[5px] w-2 h-2 rounded-full bg-neutral-300 ring-4 ring-white"></div>
        <p className="text-[10px] text-neutral-500 leading-tight">
          <span className="font-bold text-neutral-700">Submitted:</span> {bill.entryAt ? formatTime(bill.entryAt) : 'N/A'}<br/>
          <span className="italic">by {enteredBy}</span>
        </p>
      </div>

      <div className="relative">
        <div className={`absolute -left-[17px] top-[5px] w-2 h-2 rounded-full ring-4 ring-white ${bill.accountsReceivedAt ? 'bg-indigo-400' : 'bg-neutral-200'}`}></div>
        <p className="text-[10px] text-neutral-500 leading-tight">
          <span className={`font-bold ${bill.accountsReceivedAt ? 'text-indigo-700' : 'text-neutral-400'}`}>Accounts Received:</span><br/>
          {bill.accountsReceivedAt ? formatTime(bill.accountsReceivedAt) : 'Awaiting sync'}
        </p>
      </div>

      {/* NEW: Display disbursed timeline if applicable */}
      {(bill.status === 'DISBURSED' || bill.disbursedAt) && (
        <div className="relative">
          <div className="absolute -left-[17px] top-[5px] w-2 h-2 rounded-full bg-teal-400 ring-4 ring-white"></div>
          <p className="text-[10px] text-neutral-500 leading-tight">
            <span className="font-bold text-teal-700">Disbursed:</span><br/>
            {bill.disbursedAt ? formatTime(bill.disbursedAt) : 'Processing'}
          </p>
        </div>
      )}
    </div>
  );
};

export default function AccountsHub() {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // NEW: 3 Tabs (Pending, Approved by Audit, Paid)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'DISBURSED'>('PENDING');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/bills');
      if (res.ok) setBills(await res.json());
    } catch (err) {
      console.error("Failed to fetch accounts bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleSendToAudit = async () => {
    if (!confirm(`Forward ${selectedIds.length} bills to Internal Audit for final verification?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT_TO_AUDIT' })
        });
      }
      setBills(bills.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      alert("Successfully forwarded to Internal Audit.");
    } catch (err) { alert("Failed to forward bills."); }
  };

  // NEW: Bulk function to mark Audit-approved bills as Paid/Disbursed
  const handleDisburseBills = async () => {
    if (!confirm(`Mark ${selectedIds.length} approved bills as officially Paid/Disbursed?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DISBURSED' })
        });
      }
      // Update UI state instantly to Disbursed
      setBills(bills.map(b => selectedIds.includes(b.id) ? { ...b, status: 'DISBURSED', disbursedAt: new Date().toISOString() } : b));
      setSelectedIds([]);
      alert("Successfully marked as Disbursed.");
    } catch (err) { alert("Failed to disburse bills."); }
  };

  const handleReturnToFrontDesk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId || !discrepancyNote.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reception/bills/${selectedBillId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCREPANCY', discrepancyNote })
      });
      
      if (res.ok) {
        setBills(bills.filter(b => b.id !== selectedBillId));
        setDiscrepancyModalOpen(false);
        setDiscrepancyNote('');
        setSelectedBillId(null);
      } else {
        alert("Failed to return bill.");
      }
    } catch (err) { alert("A network error occurred."); } finally { setSubmitting(false); }
  };

  const openDiscrepancyModal = (id: string) => {
    setSelectedBillId(id);
    setDiscrepancyNote('');
    setDiscrepancyModalOpen(true);
  };

  const displayedBills = bills.filter(bill => {
    if (activeTab === 'PENDING' && bill.status !== 'SENT_TO_ACCOUNTS') return false;
    if (activeTab === 'APPROVED' && bill.status !== 'APPROVED_FOR_DISBURSEMENT') return false;
    if (activeTab === 'DISBURSED' && bill.status !== 'DISBURSED') return false;
    
    const searchString = `${bill.vendor?.name} ${bill.systemSerialNo} ${bill.billNumber}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedBills.length) setSelectedIds([]);
    else setSelectedIds(displayedBills.map(b => b.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-none space-y-6 animate-in fade-in duration-300 pb-24">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" size={32} /> Accounts Hub
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review physical bills, resolve discrepancies, and process disbursements.</p>
        </div>
      </header>

      {/* BULK ACTION BARS */}
      {selectedIds.length > 0 && activeTab === 'PENDING' && (
        <div className="bg-indigo-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200 border border-indigo-800">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-white text-indigo-900 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>bills verified and ready for audit</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSendToAudit} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md border border-indigo-500 hover:border-indigo-400">
              <Send size={14} /> Send to Internal Audit
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-indigo-300 hover:text-white px-2 py-1 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && activeTab === 'APPROVED' && (
        <div className="bg-amber-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200 border border-amber-800">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-white text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>bills approved by Audit and ready to pay</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDisburseBills} className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md border border-amber-500">
              <Banknote size={14} /> Mark as Paid / Disbursed
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-amber-300 hover:text-white px-2 py-1 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* PREMIUM SaaS LIST VIEW */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Sleek Intelligent Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-neutral-50/30">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
            
            {/* 3 Tabs Filter */}
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60 shrink-0">
              <button 
                onClick={() => { setActiveTab('PENDING'); setSelectedIds([]); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'PENDING' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Clock size={14} className={activeTab === 'PENDING' ? 'text-indigo-500' : ''} /> Pending Initial Review
              </button>
              <button 
                onClick={() => { setActiveTab('APPROVED'); setSelectedIds([]); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'APPROVED' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Banknote size={14} className={activeTab === 'APPROVED' ? 'text-amber-500' : ''} /> Ready for Disbursement
              </button>
              <button 
                onClick={() => { setActiveTab('DISBURSED'); setSelectedIds([]); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'DISBURSED' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <CheckCircle2 size={14} className={activeTab === 'DISBURSED' ? 'text-teal-600' : ''} /> Disbursed (Paid)
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full xl:w-72 shrink-0">
            <Search className="absolute left-3.5 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors bg-white shadow-sm" />
          </div>
        </div>

        {/* --- GRID LIST VIEW --- */}
        <div className="flex-1 bg-white">
          {loading ? (
            <div className="h-[400px] flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={28} /></div>
          ) : displayedBills.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                <FileSpreadsheet size={24} className="text-neutral-400" />
              </div>
              <p className="font-bold text-neutral-900 text-lg">No bills in this queue</p>
              <p className="text-sm mt-1">You are all caught up for now.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {/* Desktop Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50/80 text-[10px] font-bold uppercase tracking-widest text-neutral-500 sticky top-0 z-10 border-b border-neutral-200">
                <div className="col-span-1 text-center">Select</div>
                <div className="col-span-3">Vendor & Identity</div>
                <div className="col-span-2 text-left">Invoice Details</div>
                <div className="col-span-2 text-right">Amount (৳)</div>
                <div className="col-span-3 pl-12">Timeline & Status</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* List Rows */}
              {displayedBills.map(bill => {
                const isSelected = selectedIds.includes(bill.id);
                
                return (
                  <div key={bill.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-5 lg:px-6 items-start lg:items-center transition-all group border-l-2 ${isSelected ? 'bg-indigo-50/30 border-indigo-500' : 'bg-white border-transparent hover:border-neutral-200'}`}>
                    
                    {/* 1. Select Box */}
                    <div className="col-span-1 hidden lg:flex justify-center items-center">
                      {(activeTab === 'PENDING' || activeTab === 'APPROVED') ? (
                        <button onClick={() => toggleSelectOne(bill.id)} className={`transition-colors p-1 rounded ${isSelected ? 'text-indigo-600 bg-indigo-100/50' : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100'}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center opacity-30"><CheckSquare size={18} className="text-neutral-300" /></div>
                      )}
                    </div>

                    {/* 2. Vendor & Identity */}
                    <div className="col-span-1 lg:col-span-3">
                      <div className="flex items-center gap-3">
                        {/* Mobile select checkbox */}
                        <div className="lg:hidden shrink-0">
                           {(activeTab === 'PENDING' || activeTab === 'APPROVED') && (
                             <button onClick={() => toggleSelectOne(bill.id)} className={isSelected ? 'text-indigo-600' : 'text-neutral-300'}><CheckSquare size={18} /></button>
                           )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-neutral-500" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-neutral-900 text-sm truncate">{bill.vendor?.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wider border border-indigo-100">{bill.systemSerialNo}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Invoice Details */}
                    <div className="col-span-1 lg:col-span-2 pl-12 lg:pl-0 flex flex-col justify-center">
                      <div className="font-mono text-xs font-bold text-neutral-800">
                        {new Date(bill.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1 bg-neutral-100 px-1.5 py-0.5 rounded-md inline-block w-max">
                        {bill.category}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-1">
                        Inv: {bill.billNumber || 'N/A'}
                      </div>
                    </div>

                    {/* 4. Amount */}
                    <div className="col-span-1 lg:col-span-2 text-left lg:text-right pl-12 lg:pl-0 flex flex-col justify-center">
                      <div className="text-lg font-black text-neutral-900 tracking-tight">
                        ৳ {bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* 5. Timeline & Status */}
                    <div className="col-span-1 lg:col-span-3 pl-12 flex flex-col justify-center">
                      <StatusBadge status={bill.status} />
                      <CompactTimeline bill={bill} />
                    </div>

                    {/* 6. Action */}
                    <div className="col-span-1 lg:col-span-1 flex justify-end absolute lg:relative right-4 top-4 lg:right-0 lg:top-0">
                      {activeTab === 'PENDING' && (
                        <button 
                          onClick={() => openDiscrepancyModal(bill.id)} 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-sm"
                          title="Flag Discrepancy"
                        >
                          <ShieldAlert size={14} /> Flag
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- DISCREPANCY MODAL --- */}
      {discrepancyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-5 border-b bg-amber-50 text-amber-900 font-bold flex justify-between items-center">
              <h2 className="flex items-center gap-2"><AlertCircle size={18} strokeWidth={2.5}/> Return to Entry Desk</h2>
              <button onClick={() => setDiscrepancyModalOpen(false)} className="p-1 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleReturnToFrontDesk} className="p-6 space-y-4">
              <p className="text-sm text-neutral-600">Please provide a clear reason for returning this bill to the Front Desk (e.g., missing signature, incorrect amount, blurred document).</p>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Discrepancy Note *</label>
                <textarea 
                  required rows={3} autoFocus
                  value={discrepancyNote} 
                  onChange={e => setDiscrepancyNote(e.target.value)} 
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-neutral-50/50 focus:bg-white transition-all resize-none shadow-sm" 
                  placeholder="State the exact issue here..." 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-4 border-neutral-100">
                <button type="button" onClick={() => setDiscrepancyModalOpen(false)} className="px-5 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !discrepancyNote.trim()} className="px-6 py-3 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={3} />}
                  Return Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}