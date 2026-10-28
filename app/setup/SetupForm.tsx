'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Lock, Mail, User, ShieldCheck, Loader2 } from 'lucide-react';

export default function SetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: 'FAL Enterprise',
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      router.push('/login?setup=success');
    } else {
      alert('Failed to initialize system. Please check server logs.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
        
        <div className="p-8 bg-black text-white text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight">System Initialization</h1>
          <p className="text-sm text-neutral-400 mt-2">Create the master administrator account to bootstrap your fresh production database.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Company Name</label>
            <div className="relative">
              <Building size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" placeholder="Acme Corp" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Admin Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Admin Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" placeholder="admin@company.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Secure Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-6 bg-black text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            Initialize System
          </button>
        </form>
      </div>
    </div>
  );
}