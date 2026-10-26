'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function EditCandidateModal({ isOpen, onClose, candidate, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Pull dynamic configuration from our Zustand store
  const { positions, departments, customFields, employmentTypes } = useSettingsStore();

  useEffect(() => setMounted(true), []);
  
  if (!isOpen || !candidate || !mounted) return null;

  // Parse the custom data notes array safely
  let parsedNotes: any[] = [];
  try {
    if (candidate.notes) {
      parsedNotes = typeof candidate.notes === 'string' ? JSON.parse(candidate.notes) : candidate.notes;
    }
  } catch (e) {
    console.error("Error parsing candidate notes", e);
  }

  // Helper to extract default value for a dynamic field
  const getCustomFieldValue = (label: string) => {
    const found = parsedNotes.find((n: any) => n.key === label);
    return found ? found.value : '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Re-extract dynamic fields back into the JSON array structure
    const extractedDynamicFields = customFields.map((field: any) => ({
      key: field.label,
      value: data[field.id] as string
    })).filter(f => f.value);

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
      department: data.department,
      status: data.status,
      notes: extractedDynamicFields.length > 0 ? JSON.stringify(extractedDynamicFields) : null,
      location: data.location
    };

    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (res.ok) {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  // Clean up existing database placeholders
  const defaultEmail = candidate.email && !['no email found', 'unspecified'].includes(candidate.email.toLowerCase()) ? candidate.email : '';
  const defaultPhone = candidate.phone && !['no phone found', 'unspecified'].includes(candidate.phone.toLowerCase()) ? candidate.phone : '';
  const defaultPosition = candidate.position && candidate.position.toLowerCase() !== 'unspecified' ? candidate.position : '';
  const defaultDepartment = candidate.department && candidate.department.toLowerCase() !== 'unspecified' ? candidate.department : '';
  const defaultEmploymentType = getCustomFieldValue('Employment Type') || 'Regular Employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
          <h2 className="font-semibold text-lg text-neutral-900">Edit Candidate</h2>
          <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 rounded-full bg-white border border-neutral-200">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input required name="name" defaultValue={candidate.name} type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone</label>
                <input name="phone" defaultValue={defaultPhone} type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black placeholder:text-neutral-300" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Email</label>
                <input name="email" defaultValue={defaultEmail} type="email" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black placeholder:text-neutral-300" placeholder="Optional" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Position</label>
                <input name="position" defaultValue={defaultPosition} list="positions-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" placeholder="Unspecified" />
                <datalist id="positions-list">
                  {positions?.map(pos => <option key={pos} value={pos} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Department</label>
                <input name="department" defaultValue={defaultDepartment} list="departments-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" placeholder="Unspecified" />
                <datalist id="departments-list">
                  {departments?.map(dept => <option key={dept} value={dept} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Employment Type</label>
                <select name="employmentType" defaultValue={defaultEmploymentType} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black text-sm bg-white">
                  {employmentTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Status *</label>
                <select required name="status" defaultValue={candidate.status} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-black">
                  <option value="NEW">New</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {candidate.interview && (
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} /> Meeting Link / Location
                </label>
                <input name="location" defaultValue={candidate.interview.location || ''} type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
              </div>
            )}
          </div>

          {/* DYNAMIC FIELDS FROM SETTINGS */}
          {customFields.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Custom Information</h3>
              {customFields.map((field: any) => {
                const defaultValue = getCustomFieldValue(field.label);
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select name={field.id} required={field.required} defaultValue={defaultValue} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-black">
                        <option value="">Select {field.label}</option>
                        {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input name={field.id} type={field.type} required={field.required} defaultValue={defaultValue} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-neutral-50 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}