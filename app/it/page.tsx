'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Laptop, Monitor, Search, Plus, UserCheck, 
  History, AlertTriangle, CheckCircle, Loader2, Users,
  Cpu, Printer, Phone, Video, Battery, Mouse, Wrench, Trash2, Download
} from 'lucide-react';

const ASSET_CATEGORIES = [
  { id: 'Laptop', icon: Laptop }, { id: 'Desktop', icon: Cpu },
  { id: 'Printer', icon: Printer }, { id: 'IP_Phone', icon: Phone },
  { id: 'CC_Camera', icon: Video }, { id: 'Monitor', icon: Monitor },
  { id: 'UPS', icon: Battery }, { id: 'Accessories', icon: Mouse }
];

export default function ITAssetsDashboard() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);

  // Forms
  const [assetForm, setAssetForm] = useState({ name: '', category: 'Laptop', serialNumber: '', condition: 'GOOD', location: '', ipAddress: '', notes: '', assignedToId: '' });
  const [assignForm, setAssignForm] = useState({ employeeId: '', notes: '' });

  // Autocomplete for Assigning
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/it/assets');
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Employee Autocomplete Logic
  useEffect(() => {
    if (empSearchQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/employees');
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter((emp: any) => 
            emp.employeeCode?.toLowerCase().includes(empSearchQuery.toLowerCase()) || 
            emp.name?.toLowerCase().includes(empSearchQuery.toLowerCase())
          );
          setSuggestions(filtered.slice(0, 5));
          setShowDropdown(true);
        }
      } catch (error) {}
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [empSearchQuery]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = { ...assetForm };
    if (payload.assignedToId) payload.status = 'ASSIGNED';
    
    try {
      const res = await fetch('/api/it/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchAssets();
        setIsAssetModalOpen(false);
        setAssetForm({ name: '', category: 'Laptop', serialNumber: '', condition: 'GOOD', location: '', ipAddress: '', notes: '', assignedToId: '' });
      } else {
        alert("Failed to create asset.");
      }
    } catch (err) { alert("Network error"); }
    setSubmitting(false);
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/it/assets/${selectedAsset.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      if (res.ok) {
        fetchAssets();
        setIsAssignModalOpen(false);
      } else {
        alert("Failed to assign asset.");
      }
    } catch (err) { alert("Network error"); }
    setSubmitting(false);
  };

  const handleReturnAsset = async (assetId: string) => {
    if(!confirm("Mark this asset as returned to the IT department?")) return;
    try {
      const res = await fetch(`/api/it/assets/${assetId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETURN' })
      });
      if (res.ok) fetchAssets();
    } catch (err) { alert("Network error"); }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this asset and its entire history?')) return;
    try {
      const res = await fetch(`/api/it/assets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAssets();
      else alert("Failed to delete. Check permissions.");
    } catch (error) { alert("Network error."); }
  };

  const openHistory = async (asset: any) => {
    setSelectedAsset(asset);
    setAssetHistory([]);
    setIsHistoryModalOpen(true);
    try {
      const res = await fetch(`/api/it/assets/${asset.id}/history`);
      if (res.ok) setAssetHistory(await res.json());
    } catch (err) {}
  };
  
  const getCategoryIcon = (category: string) => {
    const matched = ASSET_CATEGORIES.find(c => c.id === category);
    return matched ? matched.icon : Monitor;
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Laptop className="text-blue-600" /> IT Assets Hub
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage hardware inventory, assignments, and lifecycle tracking.</p>
        </div>
        <button onClick={() => setIsAssetModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
          <Plus size={16} /> New Asset
        </button>
      </header>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Assets</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{assets.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">In Storage</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{assets.filter(a => a.status === 'AVAILABLE').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-blue-100 bg-blue-50/30 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Assigned</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{assets.filter(a => a.status === 'ASSIGNED').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-100 bg-amber-50/30 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Maintenance</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{assets.filter(a => a.status === 'MAINTENANCE').length}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" placeholder="Search asset, serial, or employee..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black transition-shadow bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={24} /></div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
              <Cpu size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">No assets found</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-[11px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4">Asset Details</th>
                  <th className="px-6 py-4">Serial No.</th>
                  <th className="px-6 py-4">Current Assignment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssets.map(asset => {
                  const Icon = getCategoryIcon(asset.category);
                  return (
                    <tr key={asset.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0 shadow-sm">
                            <Icon size={14} />
                          </div>
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase mt-1 pl-10 tracking-wider font-bold">{asset.category}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-600">{asset.serialNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {asset.assignedTo ? (
                          <div>
                            <div className="font-bold text-neutral-900">{asset.assignedTo.name}</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{asset.assignedTo.employeeCode}</div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">Unassigned (In IT Store)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                          asset.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {asset.status === 'AVAILABLE' ? (
                            <button onClick={() => { setSelectedAsset(asset); setIsAssignModalOpen(true); setEmpSearchQuery(''); setAssignForm({employeeId: '', notes: ''}); }} className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-1.5">
                              <UserCheck size={14} /> Assign
                            </button>
                          ) : (
                            <button onClick={() => handleReturnAsset(asset.id)} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-200">
                              Return
                            </button>
                          )}
                          <button onClick={() => openHistory(asset)} className="px-2 py-1.5 text-neutral-500 hover:text-blue-600 border border-neutral-200 rounded-lg hover:bg-blue-50 transition-colors" title="View History Logs">
                            <History size={16} />
                          </button>
                          <button onClick={() => handleDelete(asset.id)} className="px-2 py-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1" title="Delete">
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

      {/* --- ADD NEW ASSET MODAL --- */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="text-blue-600"/> Register New Asset
            </h2>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Asset Name / Model *</label>
                <input required type="text" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-black" placeholder="e.g. MacBook Pro M2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Category *</label>
                  <select required value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:border-black">
                    {ASSET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Condition</label>
                  <select required value={assetForm.condition} onChange={e => setAssetForm({...assetForm, condition: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:border-black">
                    <option>NEW</option><option>GOOD</option><option>FAIR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Serial Number</label>
                <input type="text" value={assetForm.serialNumber} onChange={e => setAssetForm({...assetForm, serialNumber: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm font-mono outline-none focus:border-black" placeholder="SN-123456" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setIsAssetModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg flex items-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin"/>} Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN ASSET MODAL --- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-visible">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <UserCheck className="text-blue-600"/> Assign Asset
            </h2>
            <p className="text-sm font-bold text-neutral-500 mb-5">{selectedAsset?.name} ({selectedAsset?.serialNumber})</p>
            
            <form onSubmit={handleAssignAsset} className="space-y-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Assign To Employee *</label>
                <input 
                  type="text" value={empSearchQuery}
                  onChange={(e) => { setEmpSearchQuery(e.target.value); setAssignForm({ ...assignForm, employeeId: '' }); }}
                  placeholder="Search name or ID..." 
                  className="w-full p-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30" required
                />
                {showDropdown && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-auto">
                    {suggestions.map((emp) => (
                      <li key={emp.id} onClick={() => { setEmpSearchQuery(`${emp.employeeCode} - ${emp.name}`); setAssignForm({...assignForm, employeeId: emp.id}); setShowDropdown(false); }} className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b last:border-0">
                        <div className="font-bold text-sm">{emp.name}</div>
                        <div className="text-xs text-neutral-500">{emp.employeeCode} - {emp.department}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Assignment Notes</label>
                <textarea rows={2} value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-black" placeholder="Optional notes for the history log..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting || !assignForm.employeeId} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {submitting && <Loader2 size={14} className="animate-spin"/>} Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HISTORY LOGGER MODAL --- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right-full duration-300 border-l">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><History className="text-blue-600"/> Asset History</h2>
                <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-wider">{selectedAsset?.name}</p>
                <p className="text-[10px] font-mono text-neutral-400">{selectedAsset?.serialNumber}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full bg-neutral-50"><X size={18} /></button>
            </div>

            <div className="space-y-0">
              {assetHistory.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <History size={32} className="mx-auto mb-3 opacity-20"/>
                  <p className="font-bold text-neutral-600">No History Available</p>
                  <p className="text-xs mt-1">This asset has never been assigned.</p>
                </div>
              ) : (
                assetHistory.map((log, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full mt-1 border-2 border-white shadow-sm z-10 ${log.action === 'ASSIGNED' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                      {i !== assetHistory.length - 1 && <div className="w-0.5 h-full bg-neutral-200 -mt-1 group-hover:bg-neutral-300 transition-colors"></div>}
                    </div>
                    <div className="pb-6">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">
                        {new Date(log.performedAt).toLocaleString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div className="font-bold text-sm text-neutral-900">
                        {log.action === 'ASSIGNED' ? (
                          <span>Assigned to <span className="text-blue-600">{log.employee?.name}</span></span>
                        ) : (
                          <span className="text-emerald-600">Returned to IT Store</span>
                        )}
                      </div>
                      {log.notes && (
                        <div className="mt-2 p-2.5 bg-neutral-50 border border-neutral-100 rounded-lg text-xs text-neutral-600 italic">
                          "{log.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}