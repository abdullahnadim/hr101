'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: any) => void;
  employees: any[];
}

export default function ProvisionUserModal({ isOpen, onClose, onSuccess, employees }: ProvisionModalProps) {
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({ 
    employeeId: '', 
    email: '', 
    password: '', 
    roleId: '' 
  });

  // Fetch dynamic roles from the database
  useEffect(() => {
    if (isOpen) {
      fetch('/api/roles')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setRoles(data);
        })
        .catch(() => setError("Failed to load access roles."));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setFormData({ ...formData, employeeId: empId, email: emp?.email || formData.email });
  };

  const handleGeneratePassword = () => {
    if (!formData.employeeId) return setError("Please select an employee first to generate a password.");
    const emp = employees.find(e => e.id === formData.employeeId);
    if (emp) {
      const firstName = emp.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      setFormData({ ...formData, password: `${firstName}321!` });
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to provision user');
      
      onSuccess(data);
      setFormData({ employeeId: '', email: '', password: '', roleId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProvisioning(false);
    }
  };

  // Dynamically calculate which modules this role unlocks based on live DB permissions
  const selectedRole = roles.find(r => r.id === formData.roleId);
  const unlockedModules = selectedRole 
    ? Array.from(new Set(selectedRole.permissions?.map((p: any) => p.module.replace('_', ' ')) || []))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Provision System Access</h2>
            <p className="text-sm text-neutral-500 mt-1">Generate credentials and map HR profiles to system roles.</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm text-blue-600">
            <KeyRound size={20} />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Col: Credentials */}
            <div className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5 tracking-wider">Link HR Profile</label>
                <select value={formData.employeeId} onChange={e => handleEmployeeSelect(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm bg-white font-medium transition-colors">
                  <option value="">-- No HR Link (External User) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5 tracking-wider">Login Email *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="employee@fal.com.bd" />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Temporary Password *</label>
                  <button type="button" onClick={handleGeneratePassword} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">Auto-Gen</button>
                </div>
                <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm font-mono transition-colors" placeholder="Minimum 6 characters" />
              </div>
            </div>

            {/* Right Col: Role Selection */}
            <div className="bg-neutral-50/80 rounded-2xl p-6 border border-neutral-200 flex flex-col">
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-3 tracking-wider">Assign Master Role *</label>
              
              <select required value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white font-bold text-blue-900 transition-colors shadow-sm mb-6">
                <option value="" disabled>-- Select a Role --</option>
                {roles.map((role: any) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              <div className="flex-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-neutral-200 pb-2">Granted Module Access:</p>
                {formData.roleId ? (
                  unlockedModules.length > 0 ? (
                    <ul className="space-y-2.5">
                      {unlockedModules.map((module: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {module}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">This role currently has no permissions assigned.</p>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-50 py-4">
                    <ShieldCheck size={32} className="mb-2" />
                    <p className="text-xs font-bold">Select a role to preview access</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={provisioning || !formData.roleId} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95">
              {provisioning ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16}/>} Provision Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}