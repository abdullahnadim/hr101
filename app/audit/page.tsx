'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Search, Loader2, Send, AlertCircle, 
  CheckCircle2, Clock, CheckSquare, Square, X, ArrowRight, ShieldAlert 
} from 'lucide-react';

interface BillEntry {
  id: string;
  systemSerialNo: string;
  billNumber: string;
  billDate: string;
  amount: number;
  category: string;
  department: string;
  status: string;
  vendor: { name: string };
  recordedBy?: { name: string };
}

export default function InternalAuditHub() {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED'>('PENDING');
  
  // Selection for Bulk Disbursement
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Discrepancy Modal State
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch('/api/audit/bills');
      if (res.ok) setBills(await res.json());
    } catch (err) {
      console.error("Failed to fetch audit bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // --- BULK ACTION: FORWARD FOR DISBURSEMENT ---
  const handleApproveDisbursement = async () => {
    if (!confirm(`Approve ${selectedIds.length} bills for final payment disbursement?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reception/bills/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED_FOR_DISBURSEMENT' })
        });
      }
      setBills(bills.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      alert("Successfully forwarded back to Accounts for final disbursement.");
    } catch (err) {
      alert("Failed to approve bills.");
    }
  };

  // --- SINGLE ACTION: FLAG DISCREPANCY ---
  const handleFlagDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId || !discrepancyNote.trim()) return;
    
    setSubmitting(true);
    try {
      // Returns it to Discrepancy mode for front-desk/accounts to fix
      const res = await fetch(`/api/reception/bills/${selectedBillId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCREPANCY', discrepancyNote: `[AUDIT FLAG]: ${discrepancyNote}` })
      });
      
      if (res.ok) {
        setBills(bills.filter(b => b.id !== selectedBillId));
        setDiscrepancyModalOpen(false);
        setDiscrepancyNote('');
        setSelectedBillId(null);
      } else {
        alert("Failed to flag bill.");
      }
    } catch (err) {
      alert("A network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDiscrepancyModal = (id: string) => {
    setSelectedBillId(id);
    setDiscrepancyNote('');
    setDiscrepancyModalOpen(true);
  };

  // --- FILTERING ---
  const displayedBills = bills.filter(bill => {
    if (activeTab === 'PENDING' && bill.status !== 'SENT_TO_AUDIT') return false;
    if (activeTab === 'APPROVED' && bill.status !== 'APPROVED_FOR_DISBURSEMENT') return false;
    
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
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={32} /> Internal Audit
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Verify accounts data and approve final disbursements.</p>
        </div>
      </header>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && activeTab === 'PENDING' && (
        <div className="bg-emerald-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-white text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>bills verified for final payment</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleApproveDisbursement}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Send size={14} /> Forward for Disbursement
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-emerald-300 hover:text-white px-2 py-1">Deselect All</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Tabs & Search */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button 
              onClick={() => { setActiveTab('PENDING'); setSelectedIds([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'PENDING' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Clock size={14} /> Awaiting Verification
            </button>
            <button 
              onClick={() => { setActiveTab('APPROVED'); setSelectedIds([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'APPROVED' ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
            >
              <CheckCircle2 size={14} /> Approved for Payment
            </button>
          </div>
          
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search vendor, serial, invoice..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black transition-shadow bg-white" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-64 flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={28} /></div>
          ) : displayedBills.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
              <ShieldCheck size={48} className="text-neutral-200 mb-4" />
              <p className="font-bold text-neutral-900">Audit Queue Clear</p>
              <p className="text-sm">There are no pending bills requiring your verification.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[11px] uppercase tracking-wider sticky top-0">
                <tr>
                  {activeTab === 'PENDING' && (
                    <th className="px-4 py-4 w-12 text-center">
                      <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-black">
                        {selectedIds.length === displayedBills.length && displayedBills.length > 0 ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                      </button>
                    </th>
                  )}
                  <th className="px-6 py-4">System Serial</th>
                  <th className="px-6 py-4">Vendor & Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  {activeTab === 'PENDING' && <th className="px-6 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedBills.map(bill => {
                  const isSelected = selectedIds.includes(bill.id);
                  return (
                    <tr key={bill.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      {activeTab === 'PENDING' && (
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => toggleSelectOne(bill.id)} className="text-neutral-400 hover:text-black">
                            {isSelected ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-emerald-700">{bill.systemSerialNo}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5 tracking-wider uppercase">Inv: {bill.billNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{bill.vendor?.name}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Date: {new Date(bill.billDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-neutral-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-neutral-700 uppercase tracking-wider border border-neutral-200">{bill.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-neutral-900 text-base">
                        ৳ {bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {activeTab === 'PENDING' && (
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openDiscrepancyModal(bill.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                          >
                            <ShieldAlert size={14} /> Audit Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Audit Reject Modal */}
      {discrepancyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b bg-amber-50 text-amber-900 font-bold flex justify-between items-center">
              <h2 className="flex items-center gap-2"><ShieldAlert size={18} /> Reject Audit Verification</h2>
              <button onClick={() => setDiscrepancyModalOpen(false)} className="p-1 hover:bg-amber-100 rounded text-amber-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleFlagDiscrepancy} className="p-6 space-y-4">
              <p className="text-sm text-neutral-600">Provide the audit finding/reason for rejecting this bill. It will be flagged as a discrepancy and returned to the entry team.</p>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Audit Finding *</label>
                <textarea 
                  required rows={3} autoFocus
                  value={discrepancyNote} 
                  onChange={e => setDiscrepancyNote(e.target.value)} 
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:border-amber-500 outline-none bg-white transition-colors resize-none" 
                  placeholder="State the audit mismatch here..." 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-4 border-neutral-100">
                <button type="button" onClick={() => setDiscrepancyModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !discrepancyNote.trim()} className="px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Reject Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}