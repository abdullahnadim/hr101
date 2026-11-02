'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Search, Loader2, ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin, Download, Upload, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', status: 'ACTIVE' });

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openNewModal = () => {
    setEditingVendorId(null);
    setFormData({ name: '', phone: '', email: '', address: '', status: 'ACTIVE' });
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setFormData({
      name: vendor.name,
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      status: vendor.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const isEditing = !!editingVendorId;
    const url = isEditing ? `/api/vendors/${editingVendorId}` : '/api/vendors';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const savedVendor = await res.json();
        if (isEditing) {
          setVendors(vendors.map(v => v.id === editingVendorId ? savedVendor : v));
        } else {
          setVendors([...vendors, savedVendor].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save vendor. Check your permissions.");
      }
    } catch (error) {
      alert("A network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVendors(vendors.filter(v => v.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete vendor."); 
      }
    } catch (error) {
      alert("A network error occurred.");
    }
  };

  // --- BULK IMPORT & TEMPLATE EXPORT ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Vendor Name': 'ABC Suppliers Ltd', 'Phone': '01711000000', 'Email': 'contact@abc.com', 'Address': 'Dhaka, Bangladesh' },
      { 'Vendor Name': 'Global Tech Solutions', 'Phone': '', 'Email': 'sales@globaltech.net', 'Address': '' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Vendor_Import_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0]; 
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let failCount = 0;

        // Sequentially create vendors using your existing POST endpoint
        for (const row of rawData as any[]) {
          const name = row['Vendor Name'] || row['Name'] || row['Vendor'];
          if (!name) continue;

          const payload = {
            name: name.toString().trim(),
            phone: row['Phone'] ? row['Phone'].toString().trim() : '',
            email: row['Email'] ? row['Email'].toString().trim() : '',
            address: row['Address'] ? row['Address'].toString().trim() : ''
          };

          const res = await fetch('/api/vendors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) successCount++;
          else failCount++;
        }

        alert(`Import Complete!\nSuccessfully added: ${successCount}\nFailed/Skipped: ${failCount}`);
        if (successCount > 0) fetchVendors(); // Refresh the list
        
      } catch (error) {
        console.error(error);
        alert("Error parsing Excel file. Please use the downloaded template format.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24">
      
      <Link href="/configuration" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
        <ArrowLeft size={16} /> Back to Settings
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} /> Vendor Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage global vendors and suppliers used across the organization.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={16} /> Template
          </button>

          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {importing ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <FileSpreadsheet size={16} />} 
            {importing ? 'Importing...' : 'Bulk Import'}
          </button>

          <button onClick={openNewModal} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-800 shadow-sm active:scale-95 transition-transform">
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search vendors by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black transition-shadow bg-white" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-[400px] flex justify-center items-center text-neutral-400"><Loader2 className="animate-spin" size={28} /></div>
          ) : filteredVendors.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400">
              <Building2 size={48} className="text-neutral-200 mb-4 opacity-50" />
              <p className="font-bold text-neutral-900">No vendors found</p>
              <p className="text-sm mt-1">Add a vendor manually or use the bulk import tool.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[11px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">Vendor Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-neutral-50/80 transition-colors group">
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="font-bold text-neutral-900 text-base truncate">{vendor.name}</div>
                      {vendor.address && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1.5">
                          <MapPin size={12} className="shrink-0" /> <span className="truncate max-w-[250px]">{vendor.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-[180px]">
                      <div className="flex flex-col gap-1.5 text-sm text-neutral-600">
                        {vendor.email ? <div className="flex items-center gap-2"><Mail size={14} className="text-neutral-400"/> <span className="truncate">{vendor.email}</span></div> : null}
                        {vendor.phone ? <div className="flex items-center gap-2"><Phone size={14} className="text-neutral-400"/> {vendor.phone}</div> : null}
                        {!vendor.email && !vendor.phone && <span className="text-neutral-400 italic text-xs">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${vendor.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right min-w-[100px]">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(vendor)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit Vendor">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(vendor.id, vendor.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Vendor">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b bg-neutral-50 flex justify-between items-center">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                {editingVendorId ? 'Edit Vendor Details' : 'Add New Vendor'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Company/Vendor Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none transition-colors" placeholder="e.g. Acme Corp" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none transition-colors" placeholder="+880..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none transition-colors" placeholder="contact@" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Address</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none resize-none transition-colors" placeholder="Full address..." />
              </div>

              {editingVendorId && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none bg-white transition-colors">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive (Disabled)</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t mt-6 border-neutral-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-lg disabled:opacity-50 transition-colors active:scale-95 shadow-sm">
                  {submitting ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}