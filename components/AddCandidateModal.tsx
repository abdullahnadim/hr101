'use client';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function AddCandidateModal({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Pull dynamic configuration from our Zustand store
  const { positions, customFields, employmentTypes } = useSettingsStore();

  useEffect(() => setMounted(true), []);
  
  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Extract dynamic fields and package them cleanly into the "notes" JSON
    const extractedDynamicFields = customFields.map(field => ({
      key: field.label,
      value: data[field.id] as string
    })).filter(f => f.value); // Only save if user typed something

    // Safely append Employment Type so we don't need a DB migration
    if (data.employmentType) {
      extractedDynamicFields.push({
        key: 'Employment Type',
        value: data.employmentType as string
      });
    }

    const formattedData = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      position: data.position,
      notes: extractedDynamicFields.length > 0 ? JSON.stringify(extractedDynamicFields) : null
    };

    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (res.ok) {
      const newCandidate = await res.json();
      onSuccess(newCandidate);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="font-semibold text-lg text-neutral-900">Add Candidate</h2>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Base Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input required name="name" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="e.g. Jane Doe" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone *</label>
                <input required name="phone" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="+8801XXXXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Email *</label>
                <input required name="email" type="email" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="jane@example.com" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Position with native Auto-suggest Datalist */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Position *</label>
                <input 
                  required 
                  name="position" 
                  list="positions-list" 
                  autoComplete="off"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" 
                  placeholder="Type or select" 
                />
                <datalist id="positions-list">
                  {positions.map(pos => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>

              {/* Employment Type Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Employment Type *</label>
                <select 
                  required 
                  name="employmentType" 
                  defaultValue="Regular Employee"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                >
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamically Rendered Custom Settings Fields */}
          {customFields.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-4">
              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input 
                    name={field.id} 
                    type={field.type} 
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" 
                    placeholder={`Enter ${field.label.toLowerCase()}`} 
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-neutral-50 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}