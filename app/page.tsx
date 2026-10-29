'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, Monitor, User, ArrowRight, 
  Loader2, Laptop, Clock, ShieldAlert, Cpu, Smartphone, Building2
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmployeeHub() {
  const { data: session, status } = useSession();
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [greeting, setGreeting] = useState('Welcome');

  // Dynamic Time-based Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Safely fetch assigned IT assets without crashing if unauthorized
  useEffect(() => {
    if (session?.user?.email) {
      setLoadingAssets(true);
      fetch('/api/it-assets')
        .then(res => res.json())
        .then(data => {
          // FIX: Ensure data is an array before filtering (handles RBAC error objects safely)
          if (Array.isArray(data)) {
            const assigned = data.filter((asset: any) => asset.assignedTo?.email === session.user?.email);
            setMyAssets(assigned);
          } else {
            setMyAssets([]); // Fallback to empty if unauthorized to read global assets
          }
        })
        .catch(err => {
          console.error("Failed to fetch assets:", err);
          setMyAssets([]);
        })
        .finally(() => setLoadingAssets(false));
    }
  }, [session]);

  const getCategoryIcon = (category: string) => {
    switch(category?.toUpperCase()) {
      case 'LAPTOP': return <Laptop size={18} />;
      case 'DESKTOP': return <Cpu size={18} />;
      case 'MOBILE': return <Smartphone size={18} />;
      default: return <Monitor size={18} />;
    }
  };

  if (status === "loading") {
    return <div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'Team Member';
  const roleName = (session?.user as any)?.roleName?.replace('_', ' ') || 'Employee';

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* --- HERO BANNER --- */}
      <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-emerald-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">
            <Clock size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4 leading-tight">
            {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">{firstName}</span>.
          </h1>
          <p className="text-neutral-500 text-base md:text-lg max-w-2xl font-medium">
            Your central workspace for booking conference rooms, managing your assigned hardware, and accessing company resources.
          </p>
        </div>
      </section>

      {/* --- QUICK ACTIONS GRID --- */}
      <section>
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/conference" className="group bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition-all hover:border-blue-200 flex flex-col h-full">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">Book a Room</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Reserve a conference room or workspace for your next meeting.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mt-auto group-hover:gap-3 transition-all">
              Reserve Now <ArrowRight size={16} />
            </div>
          </Link>

          <div className="group bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col h-full opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">Request Leave</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Apply for PTO, sick leave, or view your upcoming holidays.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 mt-auto">
              Coming Soon
            </div>
          </div>

          <div className="group bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col h-full opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldAlert size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">IT Support Ticket</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Report hardware issues or request software access.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600 mt-auto">
              Coming Soon
            </div>
          </div>
        </div>
      </section>

      {/* --- DASHBOARD WIDGETS --- */}
      {session && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PROFILE WIDGET */}
          <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <User size={16} className="text-indigo-600"/> Employee Profile
              </h3>
            </div>
            
            <div className="flex items-center gap-4 p-5 border border-neutral-100 rounded-xl bg-neutral-50/50 mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                {session.user?.name?.charAt(0) || 'E'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="font-black text-neutral-900 text-lg truncate leading-tight">{session.user?.name}</p>
                <p className="text-sm font-medium text-neutral-500 truncate">{session.user?.email}</p>
                <span className="mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 uppercase tracking-widest px-2.5 py-1 rounded-md w-fit">
                  {roleName}
                </span>
              </div>
            </div>
            
            <div className="mt-auto p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex gap-3 items-start">
              <ShieldAlert size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                Your dashboard access is dictated by your assigned role. Contact your system administrator if you are missing modules.
              </p>
            </div>
          </div>

          {/* IT ASSETS WIDGET */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Monitor size={16} className="text-blue-600"/> My Assigned Hardware
              </h3>
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col">
              {loadingAssets ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" /></div>
              ) : myAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                  <Laptop size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-bold text-neutral-600">No Hardware Assigned</p>
                  <p className="text-xs mt-1">You currently have no IT assets assigned to your profile.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myAssets.map(asset => (
                    <div key={asset.id} className="flex flex-col p-5 border border-neutral-100 rounded-xl bg-neutral-50 hover:bg-white hover:border-neutral-200 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-500 shadow-sm shrink-0 group-hover:text-blue-600 transition-colors">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neutral-900 text-base truncate">{asset.name}</p>
                          <p className="text-xs text-neutral-500 font-mono mt-1">{asset.serialNumber || 'Standard Issue'}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{asset.category}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shrink-0 ${
                          asset.condition === 'NEW' || asset.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          asset.condition === 'FAIR' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {asset.condition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </section>
      )}

    </div>
  );
}