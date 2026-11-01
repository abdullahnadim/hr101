'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, Monitor, User, ArrowRight, 
  Loader2, Laptop, Clock, ShieldAlert, Cpu, 
  Smartphone, Building2, Gift, Sparkles, Mail
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmployeeHub() {
  const { data: session, status } = useSession();
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);
  
  // NEW: Dedicated state to capture the true employee name from the database
  const [employeeName, setEmployeeName] = useState('');
  const [greeting, setGreeting] = useState('Welcome');

  // Dynamic Time-based Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch IT Assets & Upcoming Birthdays
  useEffect(() => {
    if (session?.user?.email) {
      // 1. Fetch IT Assets
      setLoadingAssets(true);
      fetch('/api/it-assets')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const assigned = data.filter((asset: any) => asset.assignedTo?.email === session.user?.email);
            setMyAssets(assigned);
          } else {
            setMyAssets([]); 
          }
        })
        .catch(() => setMyAssets([]))
        .finally(() => setLoadingAssets(false));

      // 2. Fetch Employees for Birthdays & Current User Name
      setLoadingBirthdays(true);
      fetch('/api/employees')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            
            // ---> NEW: Find the logged-in user's true name from the Employee table <---
            const currentUser = data.find(emp => emp.email === session.user?.email);
            if (currentUser && currentUser.name) {
              setEmployeeName(currentUser.name);
            }

            const today = new Date();
            const currentMonth = today.getMonth();
            const currentDay = today.getDate();

            const birthdays = data
              .filter(emp => emp.dateOfBirth && emp.status === 'ACTIVE')
              .map(emp => {
                const dob = new Date(emp.dateOfBirth);
                const bMonth = dob.getMonth();
                const bDay = dob.getDate();
                
                let nextBday = new Date(today.getFullYear(), bMonth, bDay);
                if (nextBday < today) {
                  nextBday = new Date(today.getFullYear() + 1, bMonth, bDay);
                }
                const daysUntil = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 3600 * 24));
                
                return { ...emp, daysUntil, nextBday };
              })
              .filter(emp => emp.daysUntil <= 30)
              .sort((a, b) => a.daysUntil - b.daysUntil)
              .slice(0, 4); 

            setUpcomingBirthdays(birthdays);
          }
        })
        .catch(() => setUpcomingBirthdays([]))
        .finally(() => setLoadingBirthdays(false));
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

  // FALLBACK CHAIN: 1. DB Employee Name -> 2. NextAuth Session Name -> 3. "Team Member"
  const fullName = employeeName || session?.user?.name || 'Team Member';
  const roleName = (session?.user as any)?.roleName?.replace('_', ' ') || 'Employee';

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* --- HERO BANNER --- */}
      <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-emerald-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-50 to-blue-50 rounded-full blur-3xl opacity-40 -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">
            <Clock size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4 leading-tight">
            {greeting}, <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">{fullName}</span>.
          </h1>
          <p className="text-neutral-500 text-base md:text-lg max-w-2xl font-medium">
            Your central workspace for booking conference rooms, managing your assigned hardware, and keeping up with the team.
          </p>
        </div>
      </section>

      {/* --- QUICK ACTIONS GRID --- */}
      <section>
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500"/> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/conference" className="group bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-all hover:border-blue-300 flex flex-col h-full">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Building2 size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">Book a Room</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Reserve a conference room or workspace for your next meeting.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mt-auto group-hover:gap-3 transition-all">
              Reserve Now <ArrowRight size={16} />
            </div>
          </Link>

          <div className="group bg-neutral-50 border border-neutral-200 rounded-2xl p-6 flex flex-col h-full opacity-70 cursor-not-allowed">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">Request Leave</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Apply for PTO, sick leave, or view your upcoming holidays.</p>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 mt-auto">
              Coming Soon
            </div>
          </div>

          <div className="group bg-neutral-50 border border-neutral-200 rounded-2xl p-6 flex flex-col h-full opacity-70 cursor-not-allowed">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 border border-amber-100">
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

      {/* --- DASHBOARD WIDGETS ROW --- */}
      {session && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PROFILE WIDGET (Span 4) */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <User size={16} className="text-indigo-600"/> Employee Profile
              </h3>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 border border-neutral-100 rounded-2xl bg-gradient-to-b from-neutral-50 to-white mb-6 shadow-inner">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-500 text-white rounded-full flex items-center justify-center text-3xl font-black shrink-0 shadow-lg shadow-indigo-200 mb-4 ring-4 ring-white">
                {fullName.charAt(0)}
              </div>
              <p className="font-black text-neutral-900 text-xl leading-tight">{fullName}</p>
              <p className="text-sm font-medium text-neutral-500 mt-1 flex items-center gap-1.5"><Mail size={12}/> {session.user?.email}</p>
              <span className="mt-4 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 uppercase tracking-widest px-3 py-1.5 rounded-full">
                {roleName}
              </span>
            </div>
            
            <div className="mt-auto p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex gap-3 items-start">
              <ShieldAlert size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-medium text-blue-800 leading-relaxed">
                Your dashboard access is dictated by your assigned role. Contact your administrator to request additional module access.
              </p>
            </div>
          </div>

          {/* IT ASSETS WIDGET (Span 4) */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Monitor size={16} className="text-blue-600"/> Assigned Hardware
              </h3>
              <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-1 rounded-full">{myAssets.length}</span>
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
              {loadingAssets ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" /></div>
              ) : myAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                  <Laptop size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-bold text-neutral-600">No Hardware Assigned</p>
                  <p className="text-xs mt-1 text-center">You currently have no IT assets assigned to your profile.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAssets.map(asset => (
                    <div key={asset.id} className="flex flex-col p-4 border border-neutral-100 rounded-xl bg-neutral-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-500 shadow-sm shrink-0 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neutral-900 text-sm truncate">{asset.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{asset.serialNumber || 'Standard Issue'}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{asset.category}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border shrink-0 ${
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

          {/* UPCOMING BIRTHDAYS WIDGET (Span 4) */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Gift size={16} className="text-pink-500"/> Upcoming Birthdays
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col">
              {loadingBirthdays ? (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-neutral-400" /></div>
              ) : upcomingBirthdays.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                  <Gift size={32} className="mb-3 opacity-30 text-pink-400" />
                  <p className="text-sm font-bold text-neutral-600 text-center">No upcoming birthdays</p>
                  <p className="text-xs mt-1 text-center">No colleagues have birthdays in the next 30 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBirthdays.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 rounded-full flex items-center justify-center font-black text-sm border border-pink-200">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{emp.name}</p>
                          <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">{emp.department}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-md border border-pink-100">
                          {emp.daysUntil === 0 ? 'Today!' : emp.daysUntil === 1 ? 'Tomorrow' : `In ${emp.daysUntil} days`}
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                          {new Date(emp.nextBday).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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