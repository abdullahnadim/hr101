'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Save, Loader2, Lock, Check, AlertCircle } from 'lucide-react';

const MODULES = ['HR_HUB', 'RECRUITMENT', 'PAYROLL', 'ACCOUNTS', 'AUDIT', 'RECEPTION', 'IT_ASSETS', 'SETTINGS'];
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

export default function RoleManagementPage() {
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
    const res = await fetch('/api/roles');
    if (res.ok) {
      const data = await res.json();
      setRoles(data);
      if (data.length > 0 && !activeRoleId) {
        selectRole(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const selectRole = (role: any) => {
    setActiveRoleId(role.id);
    const perms = new Set<string>(role.permissions.map((p: any) => `${p.module}:${p.action}`));
    setLocalPermissions(perms);
  };

  const handleTogglePermission = (module: string, action: string) => {
    const activeRole = roles.find(r => r.id === activeRoleId);
    if (activeRole?.name === 'ADMIN' || activeRole?.name === 'Super Admin') return; // Locked

    const permString = `${module}:${action}`;
    const newPerms = new Set(localPermissions);
    
    if (newPerms.has(permString)) {
      newPerms.delete(permString);
    } else {
      newPerms.add(permString);
      // UX Logic: If granting CREATE, UPDATE, or DELETE, auto-grant READ.
      if (action !== 'READ') newPerms.add(`${module}:READ`);
    }
    setLocalPermissions(newPerms);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    const res = await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roleId: activeRoleId,
        permissions: Array.from(localPermissions)
      })
    });

    if (res.ok) {
      setSaved(true);
      fetchRoles(); // Refresh background data
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Failed to save permissions. You may lack authorization.");
    }
    setSaving(false);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRoleName, description: 'Custom Role' })
    });
    if (res.ok) {
      const created = await res.json();
      setRoles([...roles, created]);
      selectRole(created);
      setNewRoleName('');
      setShowNewRole(false);
    }
    setSaving(false);
  };

  const activeRole = roles.find(r => r.id === activeRoleId);
  const isLocked = activeRole?.name === 'ADMIN' || activeRole?.name === 'Super Admin';

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <ShieldCheck size={24} className="text-blue-600" /> Role Management & RBAC
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Configure granular departmental access for employee groups.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* LEFT PANEL: Role List */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Access Roles</h2>
              <button onClick={() => setShowNewRole(!showNewRole)} className="p-1 hover:bg-neutral-200 rounded transition-colors text-neutral-600">
                <Plus size={16} />
              </button>
            </div>
            
            {showNewRole && (
              <div className="p-3 bg-blue-50 border-b border-blue-100 flex gap-2">
                <input 
                  type="text" autoFocus value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Role Name..." className="w-full text-sm px-2 py-1.5 border border-blue-200 rounded focus:outline-none focus:border-blue-500"
                />
                <button onClick={handleCreateRole} disabled={saving || !newRoleName} className="bg-blue-600 text-white px-3 rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50">Save</button>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {roles.map(role => (
                <button 
                  key={role.id} onClick={() => selectRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all flex justify-between items-center ${activeRoleId === role.id ? 'bg-black text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  {role.name}
                  {(role.name === 'ADMIN' || role.name === 'Super Admin') && <Lock size={12} className={activeRoleId === role.id ? 'text-neutral-400' : 'text-neutral-300'} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Permission Matrix */}
        <div className="flex-1 flex flex-col bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden min-w-0">
          {activeRole ? (
            <>
              {/* Matrix Header */}
              <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex flex-wrap gap-4 justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    {activeRole.name} Permissions
                    {isLocked && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black flex items-center gap-1"><Lock size={10}/> Immutable</span>}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">Check the boxes below to grant access to specific software modules.</p>
                </div>
                <button 
                  onClick={handleSavePermissions} disabled={isLocked || saving || saved}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : isLocked ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                  {saving ? 'Saving...' : saved ? 'Saved' : 'Save Permissions'}
                </button>
              </div>

              {/* Matrix Grid */}
              <div className="flex-1 overflow-auto p-6">
                {isLocked && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800 text-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p><strong>System Lock:</strong> The core administrative role possesses universal access bypasses hardcoded into the backend. Its visual matrix is locked to prevent accidental lockout.</p>
                  </div>
                )}

                <div className="border border-neutral-200 rounded-xl overflow-hidden max-w-4xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-900 text-white">
                      <tr>
                        <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-1/3">Software Module</th>
                        {ACTIONS.map(action => (
                          <th key={action} className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">{action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {MODULES.map(module => (
                        <tr key={module} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-neutral-800">
                            {module.replace('_', ' ')}
                          </td>
                          {ACTIONS.map(action => {
                            const isChecked = localPermissions.has(`${module}:${action}`);
                            return (
                              <td key={`${module}-${action}`} className="px-6 py-4 text-center">
                                <label className={`inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-neutral-200'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="peer sr-only"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(module, action)}
                                    disabled={isLocked}
                                  />
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-300'}`}>
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
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              Select or create a role to configure permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}