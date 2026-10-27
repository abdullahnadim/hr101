'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Monitor, Laptop, Mouse, Keyboard, Battery, Plug, Cpu, Video, Printer, Phone,
  Search, Plus, Filter, Loader2, Wrench, CheckCircle2, User, Trash2, Download
} from 'lucide-react';

const ASSET_CATEGORIES = [
  { id: 'Laptop', icon: Laptop },
  { id: 'Desktop', icon: Cpu },
  { id: 'Printer', icon: Printer },
  { id: 'IP_Phone', icon: Phone },
  { id: 'CC_Camera', icon: Video },
  { id: 'Monitor', icon: Monitor },
  { id: 'UPS', icon: Battery },
  { id: 'Accessories', icon: Mouse }
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

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form States (Expanded for dynamic specs)
  const defaultAsset = { 
    name: '', category: 'Laptop', serialNumber: '', condition: 'NEW', status: 'AVAILABLE', location: '', ipAddress: '',
    specs: { processor: '', ram: '', storage: '' },
    credentials: { email: '', emailPassword: '', nasFolder: '', nasPassword: '' },
    notes: '' 
  };
  
  const [newAsset, setNewAsset] = useState(defaultAsset);
  const [editData, setEditData] = useState({ condition: '', status: '', assignedToId: '', location: '', ipAddress: '', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, empRes] = await Promise.all([
        fetch('/api/it-assets'),
        fetch('/api/employees')
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
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
                          (a.assignedTo?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const headers = ['Serial No', 'Brand/Model', 'Category', 'User Name', 'Department', 'Location', 'IP Address', 'Condition', 'Status'];
    
    const csvData = filteredAssets.map(a => [
      a.serialNumber || 'N/A',
      a.name,
      a.category,
      a.assignedTo?.name || 'Unassigned',
      a.assignedTo?.department || 'N/A',
      a.location || 'N/A',
      a.ipAddress || 'N/A',
      a.condition,
      a.status
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
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
    try {
      const res = await fetch('/api/it-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setAssets([await res.json(), ...assets]);
        setIsAddModalOpen(false);
        setNewAsset(defaultAsset);
      }
    } catch (error) { alert("Failed to add asset."); } finally { setSubmitting(false); }
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
      }
    } catch (error) { alert("Failed to update."); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this asset?')) return;
    try {
      const res = await fetch(`/api/it-assets/${id}`, { method: 'DELETE' });
      if (res.ok) setAssets(assets.filter(a => a.id !== id));
    } catch (error) {}
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">IT Asset Management</h1>
          <p className="text-neutral-500 mt-1">Track hardware inventory, specs, and employee network configurations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <Plus size={16} /> Register Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Inventory</p>
          <h2 className="text-2xl font-black text-neutral-900 mt-1">{totalAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Available Storage</p>
          <h2 className="text-2xl font-black text-neutral-900 mt-1">{availableAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Currently Assigned</p>
          <h2 className="text-2xl font-black text-neutral-900 mt-1">{assignedAssets}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Needs Maintenance</p>
          <h2 className="text-2xl font-black text-neutral-900 mt-1">{needsMaintenance}</h2>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by model, serial, or user..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-neutral-400" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-neutral-200 text-sm rounded-lg px-3 py-2 outline-none w-full sm:w-auto">
              <option value="ALL">All Categories</option>
              {ASSET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12">
              <Monitor size={48} className="text-neutral-200 mb-4" />
              <p>No IT assets found matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Asset Details & Config</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.map(asset => {
                  const Icon = getCategoryIcon(asset.category);
                  const specs = asset.specs ? JSON.parse(asset.specs) : null;
                  
                  return (
                    <tr key={asset.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{asset.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5 tracking-wider">
                              SN: {asset.serialNumber || 'N/A'} {asset.ipAddress && `| IP: ${asset.ipAddress}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-700">{asset.location || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          asset.condition === 'NEW' || asset.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          asset.condition === 'FAIR' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {asset.status === 'ASSIGNED' && asset.assignedTo ? (
                          <div>
                            <p className="font-semibold text-neutral-900">{asset.assignedTo.name}</p>
                            <p className="text-[10px] text-neutral-500 uppercase">{asset.assignedTo.department}</p>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            asset.status === 'AVAILABLE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            asset.status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}>
                            {asset.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(asset)} className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors mr-2">
                          Manage
                        </button>
                        <button onClick={() => handleDelete(asset.id)} className="text-neutral-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
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

      {/* --- ADD ASSET MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">Register New Asset</h2>
              <p className="text-sm text-neutral-500">Configure hardware specs and network details.</p>
            </div>
            
            <form onSubmit={handleAddAsset} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Brand / Model *</label>
                  <input type="text" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. HP EliteBook 840 G6" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Serial No *</label>
                  <input type="text" required value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. FAL/HO/IT/LP02" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Category</label>
                  <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black">
                    {ASSET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Location</label>
                  <input type="text" value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. HR Room / Reception" />
                </div>
              </div>

              {(newAsset.category === 'Laptop' || newAsset.category === 'Desktop') && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Processor</label>
                    <input type="text" value={newAsset.specs.processor} onChange={e => setNewAsset({...newAsset, specs: {...newAsset.specs, processor: e.target.value}})} className="w-full p-2 border border-neutral-200 rounded text-sm outline-none focus:border-black" placeholder="Core i3 10th Gen" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">RAM</label>
                    <input type="text" value={newAsset.specs.ram} onChange={e => setNewAsset({...newAsset, specs: {...newAsset.specs, ram: e.target.value}})} className="w-full p-2 border border-neutral-200 rounded text-sm outline-none focus:border-black" placeholder="12GB" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Storage</label>
                    <input type="text" value={newAsset.specs.storage} onChange={e => setNewAsset({...newAsset, specs: {...newAsset.specs, storage: e.target.value}})} className="w-full p-2 border border-neutral-200 rounded text-sm outline-none focus:border-black" placeholder="SSD: 120GB, HDD: 1TB" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Static IP Address</label>
                  <input type="text" value={newAsset.ipAddress} onChange={e => setNewAsset({...newAsset, ipAddress: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. 192.168.102.211" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Internal Notes</label>
                  <input type="text" value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / ASSIGN MODAL --- */}
      {isEditModalOpen && activeAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Manage Assignment</h2>
            <p className="text-sm text-neutral-500 mb-6 font-mono">{activeAsset.serialNumber}</p>
            
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-4">
                <label className="block text-xs font-bold text-blue-900 uppercase mb-2 flex items-center gap-1.5"><User size={14}/> Assign to Employee</label>
                <select value={editData.assignedToId} onChange={e => setEditData({...editData, assignedToId: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="">-- Unassigned (In Storage) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Condition</label>
                  <select value={editData.condition} onChange={e => setEditData({...editData, condition: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white outline-none">
                    <option value="NEW">NEW</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="POOR">POOR</option>
                    <option value="BROKEN">BROKEN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Location / IP</label>
                  <input type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm outline-none focus:border-black" placeholder="Location" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-neutral-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}