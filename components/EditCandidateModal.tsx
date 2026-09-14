'use client';
import { useState } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function EditCandidateModal({ isOpen, onClose, candidate, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const { positions } = useSettingsStore();
  
  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="font-semibold text-lg text-neutral-900">Edit Candidate</h2>
          <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 rounded-full">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Full Name</label>
              <input required name="name" defaultValue={candidate.name} type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Phone</label>
                <input required name="phone" defaultValue={candidate.phone} type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Email</label>
                <input required name="email" defaultValue={candidate.email} type="email" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Position</label>
                <input required name="position" defaultValue={candidate.position} list="positions-list" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                <datalist id="positions-list">
                  {positions.map(pos => <option key={pos} value={pos} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5">Status</label>
                <select required name="status" defaultValue={candidate.status} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-black">
                  <option value="NEW">New</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Render Location Input ONLY if candidate has an interview attached */}
            {candidate.interview && (
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} /> Meeting Link / Location
                </label>
                <input 
                  name="location" 
                  defaultValue={candidate.interview.location || ''} 
                  type="text" 
                  placeholder="e.g., https://meet.google.com/..." 
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" 
                />
              </div>
            )}
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-neutral-100 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}