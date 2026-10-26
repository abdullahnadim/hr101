'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, Calendar, 
  Building2, Activity, Hash, Loader2, FileText, ChevronRight, Edit
} from 'lucide-react';
import EditEmployeeModal from '@/components/EditEmployeeModal';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEmployee = useCallback(() => {
    if (!id) return;
    fetch(`/api/employees/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Employee not found');
        return res.json();
      })
      .then(data => { setEmployee(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm font-medium text-neutral-500">Loading profile data...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white border border-neutral-200 rounded-2xl text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><User size={24} /></div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Employee Not Found</h2>
        <p className="text-neutral-500 mb-6">The employee record you are looking for does not exist or was deleted.</p>
        <button onClick={() => router.push('/admin/employees')} className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          Back to Directory
        </button>
      </div>
    );
  }

  // Parse the dynamic JSON fields safely
  let dynamicFields: { key: string, value: string }[] = [];
  try {
    const rawData = employee.customData || employee.notes;
    if (rawData) dynamicFields = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch (e) { console.error("Failed to parse", e); }

  // Extract the specific Base64 Image and Job ID so they don't print as raw text
  const profileImage = dynamicFields.find(f => f.key === 'Profile Image')?.value;
  const jobId = dynamicFields.find(f => f.key === 'Job ID')?.value;
  
  // Filter them out for the "Additional Data" grid
  const displayFields = dynamicFields.filter(f => f.key !== 'Profile Image' && f.key !== 'Job ID');

  const joinDateFormatted = employee.joinDate 
    ? new Date(employee.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not specified';

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 pb-24 relative">
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Link href="/admin/employees" className="hover:text-black transition-colors flex items-center gap-1.5"><ArrowLeft size={16} /> Directory</Link>
          <ChevronRight size={14} className="text-neutral-300" />
          <span className="text-neutral-900">{employee.name}</span>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-neutral-50"><Edit size={14} /> Edit</button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center p-6 md:p-8 gap-6 relative">
        <div className="absolute top-0 right-0 p-6 hidden md:flex items-center gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-neutral-500 hover:text-blue-600 bg-white border border-neutral-200 hover:border-blue-200 hover:bg-blue-50 rounded-full transition-all shadow-sm" title="Edit Profile"><Edit size={16} /></button>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : employee.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'}`}>{employee.status}</span>
        </div>

        {/* Dynamically Render the Uploaded Avatar */}
        <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 text-neutral-400 rounded-full flex flex-shrink-0 items-center justify-center shadow-inner overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            <User size={40} />
          )}
        </div>
        
        <div className="flex-1 space-y-3 w-full">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">{employee.name}</h1>
            <p className="text-base text-neutral-500 font-medium flex items-center gap-2 mt-1">
              {employee.position} <span className="text-neutral-300">•</span> {employee.department}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium"><Mail size={16} className="text-neutral-400" />{employee.email || <span className="italic text-neutral-400">No email</span>}</div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium"><Phone size={16} className="text-neutral-400" />{employee.phone && employee.phone !== 'N/A' ? employee.phone : <span className="italic text-neutral-400">No phone</span>}</div>
            <div className="md:hidden mt-2 w-full">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>{employee.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50/50 flex items-center gap-2.5">
              <Briefcase size={18} className="text-blue-600" />
              <h2 className="font-bold text-neutral-900">Employment Details</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Hash size={14}/> Employee ID</p>
                <p className="font-medium text-neutral-900">{employee.employeeCode || employee.id.slice(0, 8).toUpperCase()}</p>
              </div>
              {/* Dynamically Render the Job ID */}
              {jobId && (
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={14}/> Job Req ID</p>
                  <p className="font-medium text-blue-700">{jobId}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Building2 size={14}/> Department</p>
                <p className="font-medium text-neutral-900">{employee.department}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={14}/> Job Title</p>
                <p className="font-medium text-neutral-900">{employee.position}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={14}/> Joining Date</p>
                <p className="font-medium text-neutral-900">{joinDateFormatted}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={14}/> Current Status</p>
                <p className="font-medium text-neutral-900 capitalize">{employee.status?.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50/50 flex items-center gap-2.5">
              <FileText size={18} className="text-emerald-600" />
              <h2 className="font-bold text-neutral-900">Additional Data</h2>
            </div>
            
            <div className="p-6 flex-1 bg-neutral-50/30">
              {displayFields.length > 0 ? (
                <div className="space-y-5">
                  {displayFields.map((field, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">{field.key}</p>
                      <p className="font-medium text-neutral-900 break-words">{field.value || '-'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
                  <div className="w-12 h-12 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center"><FileText size={20} /></div>
                  <p className="text-sm text-neutral-500 font-medium">No additional HR data<br/>recorded for this employee.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={employee} onSuccess={fetchEmployee} />
    </div>
  );
}