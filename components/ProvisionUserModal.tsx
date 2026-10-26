'use client';
import { useState } from 'react';
import { ShieldCheck, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

const ROLE_MODULES: Record<string, string[]> = {
  ADMIN: ['All Modules', 'System Settings', 'Billing'],
  HR_MANAGER: ['Employee Directory', 'Recruitment (ATS)', 'Leave Approvals', 'Platform Settings'],
  HR_STAFF: ['Employee Directory (View)', 'Recruitment (ATS)'],
  IT_STAFF: ['IT Asset Management', 'Conference Room Admin'],
};

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: any) => void;
  employees: any[];
}

export default function ProvisionUserModal({ isOpen, onClose, onSuccess, employees }: ProvisionModalProps) {
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState('');
  
  // Notice 'roles' is now an array to support multi-select
  const [formData, setFormData] = useState({ employeeId: '', email: '', password: '', roles: ['HR_STAFF'] });

  if (!isOpen) return null;

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setFormData({ ...formData, employeeId: empId, email: emp?.email || '' });
  };

  const handleGeneratePassword = () => {
    if (!formData.employeeId) return setError("Please select an employee first.");
    const emp = employees.find(e => e.id === formData.employeeId);
    if (emp) {
      const firstName = emp.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      setFormData({ ...formData, password: `${firstName}321` });
      setError('');
    }
  };

  const toggleRole = (roleId: string) => {
    if (roleId === 'ADMIN') {
      setFormData({ ...formData, roles: ['ADMIN'] }); // Admin overrides everything
      return;
    }
    setFormData(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles.filter(r => r !== 'ADMIN'), roleId]; // Remove admin if selecting others
      
      // Ensure at least one role is always selected
      return { ...prev, roles: newRoles.length === 0 ? ['HR_STAFF'] : newRoles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // For now, we pass the primary role to the database to prevent breaking middleware
        // We will update the schema to support arrays in the next phase
        body: JSON.stringify({ ...formData, role: formData.roles[0] }) 
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      onSuccess(data);
      setFormData({ employeeId: '', email: '', password: '', roles: ['HR_STAFF'] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProvisioning(false);
    }
  };

  // Compile unique modules based on multi-selected roles
  const unlockedModules = Array.from(new Set(formData.roles.flatMap(r => ROLE_MODULES[r] || [])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Provision System Access</h2>
            <p className="text-sm text-neutral-500 mt-1">Generate credentials and grant multi-role module access.</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full border border-neutral-200 flex items-center justify-center shadow-sm text-neutral-400">
            <KeyRound size={20} />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Col: Credentials */}
            <div className="space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Link to HR Profile</label>
                <select value={formData.employeeId} onChange={e => handleEmployeeSelect(e.target.value)} required className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm bg-white">
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Login Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" placeholder="employee@fal.com.bd" />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-neutral-700 uppercase">Temporary Password</label>
                  <button type="button" onClick={handleGeneratePassword} className="text-xs font-bold text-blue-600 hover:text-blue-800">Auto-Generate</button>
                </div>
                <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm font-mono" placeholder="Minimum 6 characters" />
              </div>
            </div>

            {/* Right Col: Multi-Select Roles */}
            <div className="bg-neutral-50/80 rounded-xl p-5 border border-neutral-200 flex flex-col">
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-3">Assign System Roles</label>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(ROLE_MODULES).map(role => (
                  <button
                    key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      formData.roles.includes(role) 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Combined Access Unlocks:</p>
                <ul className="space-y-2.5">
                  {unlockedModules.map((module, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {module}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={provisioning} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {provisioning ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16}/> Grant Access</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}