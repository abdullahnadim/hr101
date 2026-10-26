'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, User, Upload } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { positions, departments, employmentTypes, employeeFields } = useSettingsStore();

  useEffect(() => setMounted(true), []);
  
  if (!isOpen || !mounted) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage
        alert("Image is too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const extractedDynamicFields = employeeFields.map((field: any) => ({
      key: field.label,
      value: data[field.id] as string
    })).filter(f => f.value);

    if (data.employmentType) {
      extractedDynamicFields.push({ key: 'Employment Type', value: data.employmentType as string });
    }
    
    // NEW: Save the Base64 Image and Job ID into our dynamic JSON payload
    if (imagePreview) {
      extractedDynamicFields.push({ key: 'Profile Image', value: imagePreview });
    }
    if (data.jobId) {
      extractedDynamicFields.push({ key: 'Job ID', value: data.jobId as string });
    }

    const formattedData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      status: data.status || 'ACTIVE',
      joinDate: data.joinDate,
      customData: extractedDynamicFields.length > 0 ? JSON.stringify(extractedDynamicFields) : null
    };

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (res.ok) {
      const newEmployee = await res.json();
      if (onSuccess) onSuccess(newEmployee);
      setImagePreview(null); // reset
      onClose();
    } else {
      alert("Failed to add employee.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-lg text-neutral-900">Add New Employee</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Enter core details and upload a profile photo.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* NEW: Profile Avatar & Job ID Row */}
          <div className="flex items-center gap-5 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 bg-white border-2 border-dashed border-neutral-300 text-neutral-400 rounded-full flex items-center justify-center overflow-hidden shadow-sm group-hover:border-blue-400 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="opacity-50" />
                )}
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity text-[10px] font-bold tracking-wider uppercase">
                <Upload size={14} className="mb-0.5" /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Job ID (Optional)</label>
              <input name="jobId" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="e.g. REQ-2026" />
            </div>
          </div>

          {/* Base Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input required name="name" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="e.g. John Doe" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Email *</label>
                <input required name="email" type="email" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone *</label>
                <input required name="phone" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="+8801XXXXXXXXX" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Position *</label>
                <input required name="position" list="positions-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="Type or select" />
                <datalist id="positions-list">
                  {positions?.map(pos => <option key={pos} value={pos} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Department *</label>
                <input required name="department" list="departments-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="Type or select" />
                <datalist id="departments-list">
                  {departments?.map(dept => <option key={dept} value={dept} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Employment Type *</label>
                <select required name="employmentType" defaultValue="Regular Employee" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
                  {employmentTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Join Date *</label>
                <input required name="joinDate" type="date" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
              </div>
            </div>
          </div>

          {/* Dynamically Rendered Employee Custom Fields */}
          {employeeFields?.length > 0 && (
            <div className="pt-5 border-t border-neutral-100 space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Additional Details (Dynamic)</h3>
              {employeeFields.map((field: any) => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select name={field.id} required={field.required} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
                      <option value="">Select {field.label}</option>
                      {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input name={field.id} type={field.type} required={field.required} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder={`Enter ${field.label.toLowerCase()}`} />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-neutral-50 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />} Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}