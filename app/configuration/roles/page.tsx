'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Save, Loader2, Lock, Check, AlertCircle, ArrowLeft } from 'lucide-react';

// Must match your Prisma `AppModule` enums exactly
const MODULES = ['HR_HUB', 'RECRUITMENT', 'PAYROLL', 'ACCOUNTS', 'AUDIT', 'RECEPTION', 'IT_ASSETS', 'SETTINGS'];
// Must match your Prisma `PermissionAction` enums exactly
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

export default function RoleManagementPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New Role Form State
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        // Auto-select the first role if none is selected
        if (data.length > 0 && !activeRoleId) {
          selectRole(data[0]);
        } else if (activeRoleId) {
          // Refresh active role permissions in case they updated
          const updatedActive = data.find((r: any) => r.id === activeRoleId);
          if (updatedActive) selectRole(updatedActive);
        }
      }
    } catch (err) {
      console.error("Failed to load roles.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRole = (role: any) => {
    setActiveRoleId(role.id);
    // Transform Prisma relations into "MODULE:ACTION" string sets
    const perms = new Set<string>(
      role.permissions?.map((p: any) => `${p.module}:${p.action}`) || []
    );
    setLocalPermissions(perms);
  };

  const handleTogglePermission = (module: string, action: string) => {
    const activeRole = roles.find(r => r.id === activeRoleId);
    if (activeRole?.name === 'ADMIN' || activeRole?.name === 'Super Admin') return; // Immutable Lock

    const permString = `${module}:${action}`;
    const newPerms = new Set(localPermissions);
    
    if (newPerms.has(permString)) {
      newPerms.delete(permString);
    } else {
      newPerms.add(permString);
      // UX Logic: If granting CREATE, UPDATE, or DELETE, automatically grant READ.
      if (action !== 'READ') newPerms.add(`${module}:READ`);
    }
    setLocalPermissions(newPerms);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: activeRoleId,
          permissions: Array.from(localPermissions) // Converts Set to Array e.g., ["HR_HUB:READ", "HR_HUB:CREATE"]
        })
      });

      if (res.ok) {
        setSaved(true);
        fetchRoles(); // Refresh background data
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save permissions. You may lack authorization.");
      }
    } catch (error) {
      alert("A network error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: 'Custom organizational role' })
      });
      if (res.ok) {
        const created = await res.json();
        setRoles([...roles, created]);
        selectRole(created);
        setNewRoleName('');
        setShowNewRole(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create role.");
      }
    } catch (error) {
      alert("Network error creating role.");
    }
    setSaving(false);
  };

  const activeRole = roles.find(r => r.id === activeRoleId);
  const isLocked = activeRole?.name === 'ADMIN' || activeRole?.name === 'Super Admin';

  if (loading && roles.length === 0) {
    return <div className="h-screen w-full flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-screen overflow-hidden bg-white animate-in fade-in duration-300">
      
      <header className="mb-6 shrink-0">
        <button 
          onClick={() => router.push('/configuration')}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Global Settings
        </button>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <ShieldCheck size={32} className="text-blue-600" /> Roles & Permissions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Configure granular departmental access levels for employee groups.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 pb-6">
        
        {/* LEFT PANEL: Role List */}
        <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/80 flex justify-between items-center">
              <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">Access Roles</h2>
              <button onClick={() => setShowNewRole(!showNewRole)} className="p-1.5 bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 rounded-lg transition-colors text-neutral-600">
                <Plus size={14} />
              </button>
            </div>
            
            {showNewRole && (
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                <input 
                  type="text" autoFocus value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., HR Manager" className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => setShowNewRole(false)} className="text-xs font-bold text-neutral-500 px-2 py-1">Cancel</button>
                  <button onClick={handleCreateRole} disabled={saving || !newRoleName} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm active:scale-95 transition-all">Save Role</button>
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {roles.map(role => (
                <button 
                  key={role.id} onClick={() => selectRole(role)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${activeRoleId === role.id ? 'bg-black text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  {role.name}
                  {(role.name === 'ADMIN' || role.name === 'Super Admin') && <Lock size={12} className={activeRoleId === role.id ? 'text-neutral-400' : 'text-neutral-400'} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Permission Matrix */}
        <div className="flex-1 flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden min-w-0 relative">
          {activeRole ? (
            <>
              {/* Matrix Header */}
              <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/80 flex flex-wrap gap-4 justify-between items-center shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    {activeRole.name} Matrix
                    {isLocked && <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md uppercase tracking-widest font-black flex items-center gap-1 shadow-sm ml-2"><Lock size={10}/> Immutable Master</span>}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">Check the boxes below to grant module-specific capabilities.</p>
                </div>
                <button 
                  onClick={handleSavePermissions} disabled={isLocked || saving || saved}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 ${saved ? 'bg-emerald-500 text-white' : isLocked ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                  {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Permissions'}
                </button>
              </div>

              {/* Matrix Grid */}
              <div className="flex-1 overflow-auto p-6 custom-scrollbar relative">
                
                {isLocked && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm shadow-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <p><strong>System Security Lock:</strong> Master Admin roles possess universal access bypasses hardcoded into the backend infrastructure. This matrix is intentionally locked to prevent catastrophic lockouts.</p>
                  </div>
                )}

                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm max-w-5xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-900 text-white">
                      <tr>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] w-1/3">Software Module</th>
                        {ACTIONS.map(action => (
                          <th key={action} className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center w-1/6">{action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {MODULES.map(module => (
                        <tr key={module} className="hover:bg-neutral-50/80 transition-colors group">
                          <td className="px-6 py-4 font-bold text-neutral-800 border-r border-neutral-100">
                            {module.replace('_', ' ')}
                          </td>
                          {ACTIONS.map(action => {
                            // Backend maps to something like "HR_HUB:READ"
                            const isChecked = localPermissions.has(`${module}:${action}`);
                            return (
                              <td key={`${module}-${action}`} className="px-4 py-4 text-center border-r border-neutral-100 last:border-r-0">
                                <label className={`inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-neutral-200/50'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="peer sr-only"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(module, action)}
                                    disabled={isLocked}
                                  />
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${isChecked ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-110' : 'bg-white border-neutral-300'}`}>
                                    {isChecked && <Check size={14} strokeWidth={3} />}
                                  </div>
                                </label>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <ShieldCheck size={64} className="text-neutral-200 mb-4" />
              <p className="font-bold text-neutral-900 text-lg">No Role Selected</p>
              <p className="text-sm mt-1">Select a role from the left menu to configure its access matrix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}