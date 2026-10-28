'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, KeyRound, Save } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
  user: any;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/roles')
        .then(res => res.json())
        .then(data => {
            setRoles(data);
            if (user?.roleId) setSelectedRoleId(user.roleId);
        })
        .catch(err => console.error("Failed to load roles", err));
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roleId: selectedRoleId,
          password: newPassword 
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        onSuccess(updatedUser);
        setNewPassword(''); // Reset on success
        onClose();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update user.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="font-bold text-neutral-900">Edit User Access</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Manage {user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldCheck size={14}/> System Role</label>
                <select 
                    value={selectedRoleId} 
                    onChange={e => setSelectedRoleId(e.target.value)} 
                    required 
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-white text-neutral-900"
                >
                  <option value="" disabled>Select a Role...</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><KeyRound size={14}/> Reset Password</label>
                <input 
                    type="text" 
                    placeholder="Leave blank to keep current" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm font-mono"
                />
                <p className="text-[10px] text-neutral-500 mt-1.5">Optional. Sets a new login password for this user.</p>
            </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !selectedRoleId} className="px-5 py-2.5 text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}