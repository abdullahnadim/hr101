'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, User, Upload } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // State to hold fetched roles
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  
  const { positions, departments, employmentTypes, employeeFields } = useSettingsStore();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetch('/api/roles')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableRoles(data);
        })
        .catch(err => console.error("Failed to load roles", err));
    }
  }, [isOpen]);
  
  if (!isOpen || !mounted) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
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
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const extractedDynamicFields = employeeFields.map((field: any) => ({
      key: field.label,
      value: data[field.id] as string
    })).filter(f => f.value);

    if (data.employmentType) extractedDynamicFields.push({ key: 'Employment Type', value: data.employmentType as string });
    if (imagePreview) extractedDynamicFields.push({ key: 'Profile Image', value: imagePreview });
    if (data.jobId) extractedDynamicFields.push({ key: 'Job ID', value: data.jobId as string });

    const formattedData = {
      name: data.name,
      employeeCode: data.employeeCode,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string).toISOString() : null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate as string).toISOString() : new Date().toISOString(),
      status: data.status || 'ACTIVE',
      roleId: data.roleId || null,
      
      // Payroll & Compensation defaults
      baseSalary: parseFloat(data.baseSalary as string) || 0,
      mobileBillLimit: parseFloat(data.mobileBillLimit as string) || 0,
      transportRouteFare: parseFloat(data.transportRouteFare as string) || 0,
      
      customData: extractedDynamicFields.length > 0 ? JSON.stringify(extractedDynamicFields) : null
    };

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        if (onSuccess) onSuccess(responseData);
        setImagePreview(null); 
        onClose();
      } else {
        setError(responseData.error || "Failed to add employee.");
      }
    } catch (err: any) {
      setError("A network error occurred while saving.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex justify-between items-center px-8 py-6 border-b border-neutral-100 bg-neutral-50/80 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Register New Employee</h2>
            <p className="text-sm text-neutral-500 mt-1">Create an HR record with compensation details and system access.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-200/50 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-lg">{error}</div>}
          
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

          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 pt-2">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input required name="name" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Employee Code / ID *</label>
              <input required name="employeeCode" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm uppercase transition-colors font-mono" placeholder="e.g. FAL-042" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Corporate Email</label>
              <input name="email" type="email" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone *</label>
              <input required name="phone" type="text" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors" placeholder="+8801XXXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Gender</label>
              <select name="gender" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white transition-colors">
                <option value="">-- Optional --</option>
                {genders.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Department *</label>
              <input required name="department" list="departments-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors" placeholder="Type or select" />
              <datalist id="departments-list">
                {departments?.map(dept => <option key={dept} value={dept} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Position *</label>
              <input required name="position" list="positions-list" autoComplete="off" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors" placeholder="Type or select" />
              <datalist id="positions-list">
                {positions?.map(pos => <option key={pos} value={pos} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Blood Group</label>
              <select name="bloodGroup" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white transition-colors">
                <option value="">-- Optional --</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Date of Birth</label>
              <input type="date" name="dateOfBirth" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white transition-colors font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Employment Type *</label>
              <select required name="employmentType" defaultValue="Regular Employee" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
                {employmentTypes?.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 pt-2">Compensation & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Joining Date *</label>
              <input type="date" name="joiningDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white transition-colors font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Base Salary (Gross, ৳) *</label>
              <input type="number" name="baseSalary" required defaultValue="50000" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Mobile Bill Limit (৳)</label>
              <input type="number" name="mobileBillLimit" defaultValue="1500" className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors font-mono" />
            </div>
          </div>

          {/* System Role Assignment */}
          <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
            <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1.5">System Access Role</label>
            <select name="roleId" className="w-full px-3 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-white text-neutral-900 font-medium">
              <option value="">No System Access (Employee Hub Only)</option>
              {availableRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-blue-600 mt-1.5 font-medium">Assigning a role generates a login account with default password `Password123!`</p>
          </div>

          {employeeFields?.length > 0 && (
            <div className="pt-2 space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Additional Details (Dynamic)</h3>
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
          
          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white mt-4 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95 transition-all">
              {loading && <Loader2 size={16} className="animate-spin" />} Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}