'use client';
import { useState, useEffect, useRef } from 'react';
import { Receipt, Calendar, Building2, DollarSign, Plus, Clock, Search, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Vendor { id: string; name: string; }
interface BillEntry {
  id: string;
  billNumber: string;
  entryAt: string;
  billDate: string;
  amount: number;
  vendor: { name: string }; // Updated from vendorName
  recordedBy?: { name: string; employeeCode: string };
}

export default function ReceptionBillLogBook() {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Smart Autocomplete State
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [formData, setFormData] = useState({ vendorId: '', billDate: '', amount: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/reception/bills').then(res => res.json()),
      fetch('/api/vendors').then(res => res.json())
    ]).then(([billsData, vendorsData]) => {
      // SAFEGUARD: Verify the responses are actually arrays before setting state
      setBills(Array.isArray(billsData) ? billsData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
      setLoading(false);
    }).catch(error => {
      console.error("Failed to fetch data:", error);
      setBills([]);
      setVendors([]);
      setLoading(false);
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

  const handleCreateInlineVendor = async () => {
    if (!vendorSearch.trim()) return;
    try {
      const res = await fetch('/api/vendors', {
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

  const selectVendor = (vendor: Vendor) => {
    setFormData({ ...formData, vendorId: vendor.id });
    setVendorSearch(vendor.name);
    setShowVendorDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) return alert("Please select or create a vendor.");
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/reception/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newBill = await res.json();
        setBills([newBill, ...bills]);
        setIsModalOpen(false);
        setFormData({ vendorId: '', billDate: '', amount: '' });
        setVendorSearch('');
      } else {
        alert("Failed to save entry.");
      }
    } catch (error) {
      alert("A network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = bills.filter(bill => 
    bill.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
  const exactVendorMatch = vendors.find(v => v.name.toLowerCase() === vendorSearch.toLowerCase());

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <Link href="/reception" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
        <ArrowLeft size={16} /> Back to Hub
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={24} /> Bill Logbook
          </h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-800">
          <Plus size={16} /> New Bill
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search bills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-[400px] flex justify-center items-center text-neutral-400"><Loader2 className="animate-spin" size={28} /></div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[11px] uppercase">
                <tr>
                  <th className="px-6 py-4">Bill No.</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Invoice Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">{bill.billNumber}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900">{bill.vendor?.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{new Date(bill.billDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold">৳ {bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-neutral-50 font-bold text-neutral-900">Log New Bill</div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* SMART VENDOR DROPDOWN */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={14} /> Vendor Name</label>
                <input 
                  type="text" 
                  value={vendorSearch}
                  onChange={(e) => {
                    setVendorSearch(e.target.value);
                    setShowVendorDropdown(true);
                    setFormData({ ...formData, vendorId: '' }); // Clear ID when typing
                  }}
                  onFocus={() => setShowVendorDropdown(true)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none"
                  placeholder="Select or type to create..."
                />
                
                {showVendorDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredVendors.map(v => (
                      <button key={v.id} type="button" onClick={() => selectVendor(v)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors font-medium text-neutral-900 border-b border-neutral-100 last:border-0">
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} /> Date on Invoice</label>
                <input type="date" required value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} /> Amount</label>
                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting || !formData.vendorId} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-lg disabled:opacity-50">Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}