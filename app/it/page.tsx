'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Monitor, Laptop, Mouse, Keyboard, Battery, Plug, Cpu, Video, Printer, Phone,
  Search, Plus, Filter, Loader2, Wrench, User, Trash2, Download, History
} from 'lucide-react';
import Link from 'next/link';

const ASSET_CATEGORIES = [
  { id: 'Laptop', icon: Laptop }, { id: 'Desktop', icon: Cpu },
  { id: 'Printer', icon: Printer }, { id: 'IP_Phone', icon: Phone },
  { id: 'CC_Camera', icon: Video }, { id: 'Monitor', icon: Monitor },
  { id: 'UPS', icon: Battery }, { id: 'Accessories', icon: Mouse }
];

export default function ITDashboard() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const defaultAsset = { 
    name: '', category: 'Laptop', serialNumber: '', condition: 'NEW', status: 'AVAILABLE', location: '', ipAddress: '',
    specs: { processor: '', ram: '', storage: '' },
    credentials: { email: '', emailPassword: '', nasFolder: '', nasPassword: '' },
    notes: '',
    assignedToId: '' // NEW: Added assignedToId to default state
  };
  
  const [newAsset, setNewAsset] = useState(defaultAsset);
  const [editData, setEditData] = useState({ condition: '', status: '', assignedToId: '', location: '', ipAddress: '', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, empRes] = await Promise.all([
        fetch('/api/it-assets'),
        fetch('/api/employees')
      ]);
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(Array.isArray(data) ? data : []);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading IT data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived Metrics
  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === 'AVAILABLE').length;
  const assignedAssets = assets.filter(a => a.status === 'ASSIGNED').length;
  const needsMaintenance = assets.filter(a => ['FAIR', 'POOR', 'BROKEN'].includes(a.condition)).length;

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (a.assignedTo?.name && a.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Serial No', 'Brand/Model', 'Category', 'User Name', 'Department', 'Location', 'IP Address', 'Condition', 'Status', 'History/Notes'];
    const csvData = filteredAssets.map(a => [
      a.serialNumber || 'N/A', a.name, a.category, a.assignedTo?.name || 'Unassigned',
      a.assignedTo?.department || 'N/A', a.location || 'N/A', a.ipAddress || 'N/A', a.condition, a.status, `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `IT_Assets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Automatically handle status if assignment is made during creation
    const payload = { ...newAsset };
    if (payload.assignedToId) {
      payload.status = 'ASSIGNED';
    }

    try {
      const res = await fetch('/api/it-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAssets([await res.json(), ...assets]);
        setIsAddModalOpen(false);
        setNewAsset(defaultAsset);
      } else {
        alert("Failed to add asset. Check permissions.");
      }
    } catch (error) { alert("Network error."); } finally { setSubmitting(false); }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let finalStatus = editData.status;
    if (editData.assignedToId && finalStatus === 'AVAILABLE') finalStatus = 'ASSIGNED';
    if (!editData.assignedToId && finalStatus === 'ASSIGNED') finalStatus = 'AVAILABLE';

    try {
      const res = await fetch(`/api/it-assets/${activeAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, status: finalStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setAssets(assets.map(a => a.id === updated.id ? updated : a));
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update asset. Check permissions.");
      }
    } catch (error) { alert("Network error."); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this asset?')) return;
    try {
      const res = await fetch(`/api/it-assets/${id}`, { method: 'DELETE' });
      if (res.ok) setAssets(assets.filter(a => a.id !== id));
      else alert("Failed to delete. Check permissions.");
    } catch (error) { alert("Network error."); }
  };

  const openEditModal = (asset: any) => {
    setActiveAsset(asset);
    setEditData({ 
      condition: asset.condition, 
      status: asset.status, 
      assignedToId: asset.assignedToId || '', 
      location: asset.location || '',
      ipAddress: asset.ipAddress || '',
      notes: asset.notes || '' 
    });
    setIsEditModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const matched = ASSET_CATEGORIES.find(c => c.id === category);
    return matched ? matched.icon : Monitor;
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-none space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Monitor className="text-blue-600" size={24} /> IT Asset Inventory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage hardware, assignments, and service history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Inventory</p>
          <h2 className="text-3xl font-black text-neutral-900 mt-1">{totalAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Available Storage</p>
          <h2 className="text-3xl font-black text-emerald-700 mt-1">{availableAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Currently Assigned</p>
          <h2 className="text-3xl font-black text-blue-700 mt-1">{assignedAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/30 shadow-sm">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Needs Repair</p>
          <h2 className="text-3xl font-black text-red-700 mt-1">{needsMaintenance}</h2>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by model, serial, or employee..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-neutral-400" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-neutral-200 text-sm font-medium rounded-lg px-3 py-2 outline-none w-full md:w-auto">
              <option value="ALL">All Hardware</option>
              {ASSET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-neutral-200 text-sm font-medium rounded-lg px-3 py-2 outline-none w-full md:w-auto">
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={28}/></div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400 py-12">
              <Cpu size={48} className="text-neutral-200 mb-4" />
              <p className="font-bold text-neutral-900">No IT assets found</p>
              <p className="text-sm">Adjust your filters or register a new asset.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Asset Details & Config</th>
                  <th className="px-6 py-4">Status & Condition</th>
                  <th className="px-6 py-4">Assigned Employee</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.map(asset => {
                  const Icon = getCategoryIcon(asset.category);
                  
                  return (
                    <tr key={asset.id} className="hover:bg-neutral-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0 shadow-sm">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-base">{asset.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-1.5 py-0.5 rounded">{asset.category}</span>
                              <span className="text-[10px] text-neutral-500 font-mono tracking-wider">SN: {asset.serialNumber || 'N/A'}</span>
                              {asset.ipAddress && <span className="text-[10px] font-bold text-blue-600 font-mono tracking-wider">IP: {asset.ipAddress}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`w-fit px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            asset.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                          }`}>
                            {asset.status}
                          </span>
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            Condition: <span className="font-bold text-neutral-700">{asset.condition}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {asset.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                              {asset.assignedTo.name.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900">{asset.assignedTo.name}</span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">{asset.assignedTo.department} • {asset.assignedTo.employeeCode}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-neutral-400">
                            <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center border border-dashed border-neutral-300">
                              <Wrench size={12} />
                            </div>
                            <span className="text-xs font-medium italic">In IT Storage</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(asset)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                            <History size={14} /> Manage
                          </button>
                          <button onClick={() => handleDelete(asset.id)} className="text-neutral-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- ADD ASSET MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">Register New Asset</h2>
              <p className="text-sm text-neutral-500">Configure hardware specs, assignment, and network details.</p>
            </div>
            
            <form onSubmit={handleAddAsset} className="p-6 overflow-y-auto space-y-6">
              
              {/* NEW ASSIGNMENT BLOCK IN ADD MODAL */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={14}/> Assign to Employee (Optional)
                </label>
                <select value={newAsset.assignedToId} onChange={e => setNewAsset({...newAsset, assignedToId: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white font-medium">
                  <option value="">-- Unassigned (In Storage) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} • {emp.employeeCode})</option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600 mt-2 font-medium">Status will automatically set to 'ASSIGNED' if selected.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Brand / Model *</label>
                  <input type="text" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. HP EliteBook 840 G6" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Serial No *</label>
                  <input type="text" required value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black font-mono" placeholder="e.g. FAL/HO/IT/LP02" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Category</label>
                  <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black bg-white">
                    {ASSET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Location</label>
                  <input type="text" value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. HR Room / Reception" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Static IP Address</label>
                  <input type="text" value={newAsset.ipAddress} onChange={e => setNewAsset({...newAsset, ipAddress: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black font-mono" placeholder="e.g. 192.168.102.211" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Initial Notes</label>
                  <input type="text" value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="Purchase details, warranty, etc." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / ASSIGN / HISTORY MODAL --- */}
      {isEditModalOpen && activeAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-neutral-900">Manage Assignment & History</h2>
                <p className="text-[10px] font-mono text-neutral-500 mt-0.5 tracking-wider">{activeAsset.serialNumber}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
              
              <form onSubmit={handleUpdateAsset} className="p-6 space-y-5 flex-1 overflow-y-auto border-r border-neutral-100">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={14}/> Assign to Employee
                  </label>
                  <select value={editData.assignedToId} onChange={e => setEditData({...editData, assignedToId: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white font-medium">
                    <option value="">-- Unassigned (In Storage) --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} • {emp.employeeCode})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-600 mt-2 font-medium">Status automatically updates to ASSIGNED. History will log this transfer.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Condition</label>
                    <select value={editData.condition} onChange={e => setEditData({...editData, condition: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-black">
                      <option value="NEW">NEW</option>
                      <option value="GOOD">GOOD</option>
                      <option value="FAIR">FAIR</option>
                      <option value="POOR">POOR</option>
                      <option value="BROKEN">BROKEN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Status</label>
                    <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-black">
                      <option value="AVAILABLE">AVAILABLE (Storage)</option>
                      <option value="ASSIGNED">ASSIGNED (In Use)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Repair)</option>
                      <option value="RETIRED">RETIRED (Disposed)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Location</label>
                    <input type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Static IP</label>
                    <input type="text" value={editData.ipAddress} onChange={e => setEditData({...editData, ipAddress: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm font-mono outline-none focus:border-black" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Add New Note (Appends to history)</label>
                  <textarea rows={2} value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full p-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black resize-none" placeholder="Details of repair, component swap, etc..." />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save & Log History'}
                  </button>
                </div>
              </form>

              {/* Service History Sidebar */}
              <div className="w-full md:w-1/3 bg-neutral-50 p-6 overflow-y-auto flex flex-col">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><History size={14}/> Complete Log</label>
                <div className="flex-1 text-[11px] font-mono whitespace-pre-wrap text-neutral-600 space-y-2">
                  {activeAsset.notes ? activeAsset.notes : <span className="italic text-neutral-400">No service history recorded.</span>}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}