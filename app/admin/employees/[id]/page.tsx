'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, Calendar, 
  Activity, Hash, Loader2, FileText, ChevronRight, 
  Edit, CheckCircle2, Clock, Monitor, Laptop, 
  Calendar as CalendarIcon, Wallet, Bus, Shield, MapPin, Calculator, TrendingUp
} from 'lucide-react';
import EditEmployeeModal from '@/components/EditEmployeeModal';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'compensation' | 'hardware' | 'activity'>('overview');
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
        <p className="text-sm font-medium text-neutral-500">Loading comprehensive profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white border border-neutral-200 rounded-2xl text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><User size={24} /></div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Employee Record Unavailable</h2>
        <p className="text-neutral-500 mb-6">The profile you are looking for does not exist or has been permanently deleted.</p>
        <button onClick={() => router.push('/admin/employees')} className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          Return to Directory
        </button>
      </div>
    );
  }

  let dynamicFields: { key: string, value: string }[] = [];
  try {
    const rawData = employee.customData || employee.notes;
    if (rawData) dynamicFields = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch (e) {}

  const profileImage = dynamicFields.find(f => f.key === 'Profile Image')?.value;
  const jobId = dynamicFields.find(f => f.key === 'Job ID')?.value;
  const displayFields = dynamicFields.filter(f => f.key !== 'Profile Image' && f.key !== 'Job ID');

  const joinDateFormatted = employee.joiningDate || employee.joinDate 
    ? new Date(employee.joiningDate || employee.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not specified';

  const formatCurrency = (amount: number) => `৳${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6 pb-24 relative">
      
      {/* Breadcrumbs & Top Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Link href="/admin/employees" className="hover:text-black transition-colors flex items-center gap-1.5"><ArrowLeft size={16} /> Directory</Link>
          <ChevronRight size={14} className="text-neutral-300" />
          <span className="text-neutral-900 font-semibold">{employee.name}</span>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-neutral-50"><Edit size={14} /> Edit</button>
      </div>

      {/* Hero Profile Header */}
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center p-6 md:p-8 gap-6 relative">
        <div className="absolute top-0 right-0 p-6 hidden md:flex items-center gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-black hover:text-black rounded-lg transition-all shadow-sm">
            <Edit size={16} /> Manage Profile
          </button>
        </div>

        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 text-neutral-400 rounded-full flex flex-shrink-0 items-center justify-center shadow-inner overflow-hidden z-10">
          {profileImage ? (
            <img src={profileImage} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-neutral-400">{employee.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="flex-1 space-y-4 w-full z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">{employee.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : employee.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {employee.status}
              </span>
            </div>
            <p className="text-base text-neutral-600 font-medium flex items-center gap-2">
              {employee.position} <span className="text-neutral-300">•</span> {employee.department}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium"><Mail size={16} className="text-neutral-400" />{employee.email || <span className="italic text-neutral-400">No Corporate Email</span>}</div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium"><Phone size={16} className="text-neutral-400" />{employee.phone && employee.phone !== 'N/A' ? employee.phone : <span className="italic text-neutral-400">No Phone</span>}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Core Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
              <Briefcase size={18} className="text-blue-600" />
              <h2 className="font-bold text-neutral-900">Employment Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-5">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Hash size={14}/> Employee ID</p>
                <p className="font-semibold text-neutral-900 font-mono">{employee.employeeCode || employee.id.slice(0, 8).toUpperCase()}</p>
              </div>
              {jobId && (
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={14}/> ATS Job Req ID</p>
                  <p className="font-medium text-blue-700">{jobId}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={14}/> Joining Date</p>
                <p className="font-medium text-neutral-900">{joinDateFormatted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
              <Shield size={18} className="text-purple-600" />
              <h2 className="font-bold text-neutral-900">System Access</h2>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Platform Role</p>
              <div className="font-medium text-neutral-900 flex items-center gap-2">
                {employee.user ? (
                  <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-100">
                    <CheckCircle2 size={16} /> {employee.user.role.replace('_', ' ')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 bg-neutral-50 text-neutral-500 px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-200">
                    <Clock size={16} /> No Portal Access
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area: Tabs */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[650px]">
            
            <div className="flex border-b border-neutral-100 bg-neutral-50/50 overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 px-6 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-black text-black bg-white' : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-100'}`}>Custom Attributes</button>
              <button onClick={() => setActiveTab('compensation')} className={`flex-1 py-4 px-6 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'compensation' ? 'border-black text-black bg-white' : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-100'}`}>Compensation</button>
              <button onClick={() => setActiveTab('hardware')} className={`flex-1 py-4 px-6 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'hardware' ? 'border-black text-black bg-white' : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-100'}`}>IT Assets</button>
              <button onClick={() => setActiveTab('activity')} className={`flex-1 py-4 px-6 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activity' ? 'border-black text-black bg-white' : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-100'}`}>Activity Log</button>
            </div>

            <div className="p-6 md:p-8 flex-1 bg-white">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2 mb-6"><FileText size={18} className="text-emerald-600" /> Extended Profile Attributes</h3>
                  {displayFields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {displayFields.map((field, idx) => (
                        <div key={idx} className="bg-neutral-50/80 p-4 rounded-xl border border-neutral-100">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{field.key}</p>
                          <p className="font-semibold text-neutral-900 break-words text-sm">{field.value || '-'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                      <div className="w-10 h-10 bg-white text-neutral-300 rounded-full border border-neutral-200 flex items-center justify-center"><FileText size={18} /></div>
                      <p className="text-sm text-neutral-500 font-medium">No custom HR attributes configured.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Compensation Tab (UPDATED) */}
              {activeTab === 'compensation' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Wallet size={18} className="text-amber-600" /> Payroll & Benefits</h3>
                    <Link href={`/admin/payroll?employeeId=${employee.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                      View Payslips
                    </Link>
                  </div>
                  
                  {/* Primary Salary Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Gross Base Salary</p>
                      <p className="text-2xl font-black text-neutral-900">{formatCurrency(employee.baseSalary)}</p>
                      {employee.increment > 0 && (
                        <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp size={12}/> +{formatCurrency(employee.increment)} Recent Increment</p>
                      )}
                    </div>
                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calculator size={14}/> Tax Deduction</p>
                      <p className="text-2xl font-black text-neutral-900">
                        {employee.taxAmount > 0 
                          ? formatCurrency(employee.taxAmount) 
                          : employee.taxPercentage > 0 
                            ? `${employee.taxPercentage}%` 
                            : 'Exempt'
                        }
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">Per payroll cycle</p>
                    </div>
                  </div>

                  {/* Allowances Block */}
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">Allowances & Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">General Allowance</p>
                      <p className="text-lg font-bold text-neutral-900 mt-1">{formatCurrency(employee.allowance)}</p>
                    </div>
                    <div className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Transport Allowance</p>
                      <p className="text-lg font-bold text-neutral-900 mt-1">{formatCurrency(employee.transportAllowance)}</p>
                    </div>
                    <div className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Mobile Bill Limit</p>
                      <p className="text-lg font-bold text-neutral-900 mt-1">{formatCurrency(employee.mobileBillLimit)}</p>
                    </div>
                  </div>

                  {/* Logistics Block */}
                  <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5"><Bus size={14}/> Transport Logistics</p>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${employee.usesCompanyTransport ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-600'}`}>
                        {employee.usesCompanyTransport ? 'Uses Company Route' : 'Own Commute'}
                      </span>
                    </div>
                    {employee.usesCompanyTransport ? (
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Route Fare Deduction:</p>
                        <p className="text-lg font-black text-neutral-900 mt-0.5">{formatCurrency(employee.transportRouteFare)} <span className="text-xs font-normal text-neutral-500">/ month</span></p>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Employee receives full standard transport allowance in payroll.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hardware / IT Assets Tab */}
              {activeTab === 'hardware' && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Laptop size={18} className="text-indigo-600"/> Assigned Equipment</h3>
                  </div>
                  {employee.itAssets && employee.itAssets.length > 0 ? (
                    employee.itAssets.map((asset: any) => {
                      const specs = asset.specs ? (typeof asset.specs === 'string' ? JSON.parse(asset.specs) : asset.specs) : null;
                      return (
                        <div key={asset.id} className="p-5 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-neutral-900 text-base">{asset.brandModel || asset.name}</p>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                asset.condition === 'NEW' || asset.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>{asset.condition}</span>
                            </div>
                            <p className="text-xs text-neutral-500 font-mono flex flex-wrap items-center gap-2">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{asset.assetCode || asset.serialNumber || 'No Code'}</span>
                              <span>•</span><span className="uppercase">{asset.category}</span>
                              {asset.ipAddress && (<><span>•</span> <span className="font-semibold text-blue-600">IP: {asset.ipAddress}</span></>)}
                            </p>
                            {specs && Object.keys(specs).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(specs).map(([k, v]) => (
                                  <span key={k} className="px-2 py-1 bg-neutral-50 border border-neutral-100 rounded text-[10px] text-neutral-600 font-medium uppercase">
                                    {k}: <span className="font-bold text-neutral-900">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                      <Monitor size={32} className="text-neutral-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-neutral-700">No hardware assigned.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2 mb-6"><CalendarIcon size={18} className="text-blue-600"/> Conference Room History</h3>
                  {employee.roomBookings && employee.roomBookings.length > 0 ? (
                    employee.roomBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors bg-neutral-50/50">
                        <div>
                          <p className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                            <MapPin size={14} className="text-neutral-400" /> {booking.roomName}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1 ml-5">
                            {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric'})} • {booking.startTime} ({booking.durationMinutes} mins)
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>{booking.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                      <CalendarIcon size={32} className="text-neutral-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-neutral-700">No recent bookings.</p>
                    </div>
                  )}
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