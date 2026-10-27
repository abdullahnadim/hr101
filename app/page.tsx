'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, Monitor, User, LogOut, ArrowRight, 
  ShieldCheck, Loader2, Laptop
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmployeeHub() {
  const { data: session, status } = useSession();
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const role = (session?.user as any)?.role;
  // If the user has one of these roles, they get the Admin Panel button
  const isAdmin = role === 'ADMIN' || role === 'HR_MANAGER' || role === 'IT_STAFF';

  // Fetch the employee's assigned IT assets if logged in
  useEffect(() => {
    if (session?.user?.email) {
      setLoadingAssets(true);
      fetch('/api/it-assets')
        .then(res => res.json())
        .then(data => {
          // Filter assets assigned to this user's email
          const assigned = data.filter((asset: any) => asset.assignedTo?.email === session.user?.email);
          setMyAssets(assigned);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingAssets(false));
    }
  }, [session]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><Loader2 className="animate-spin text-neutral-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">FA</div>
          <span className="font-bold text-neutral-900 tracking-tight">Fashion Asia Hub</span>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-md transition-colors border border-blue-100">
                  <ShieldCheck size={16} /> Admin Panel
                </Link>
              )}
              <div className="hidden md:block text-right mr-2">
                <p className="text-sm font-bold text-neutral-900 leading-none">{session.user?.name || 'Employee'}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-1 uppercase tracking-wider">{role?.replace('_', ' ')}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-bold text-neutral-600 hover:text-black transition-colors px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 bg-white">
              Staff Login
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <section className="bg-white p-8 md:p-10 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight mb-3">
              {session ? `Welcome back, ${session.user?.name?.split(' ')[0] || 'Team'}!` : 'Welcome to the Hub'}
            </h1>
            <p className="text-neutral-500 text-base md:text-lg mb-8">
              Your central workspace for booking conference rooms, managing your assigned hardware, and accessing company resources.
            </p>
            
            <Link href="/conference" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-md">
              <Calendar size={18} /> Book a Conference Room <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </section>

        {/* Logged-In Employee Specific Modules */}
        {session && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Assigned IT Assets Widget */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2"><Monitor size={18} className="text-blue-600"/> My Assigned Hardware</h3>
              </div>
              
              <div className="space-y-3 flex-1">
                {loadingAssets ? (
                  <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>
                ) : myAssets.length === 0 ? (
                  <div className="text-center h-full flex flex-col items-center justify-center py-8 text-neutral-500 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                    <p className="text-sm font-medium">No IT assets currently assigned to you.</p>
                  </div>
                ) : (
                  myAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3.5 border border-neutral-100 rounded-xl bg-neutral-50/50 hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-neutral-600 shadow-sm shrink-0">
                          <Laptop size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm line-clamp-1">{asset.name}</p>
                          <p className="text-xs text-neutral-500 font-mono mt-0.5">{asset.serialNumber || 'Company Asset'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border shrink-0 ${
                        asset.condition === 'NEW' || asset.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        asset.condition === 'FAIR' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {asset.condition}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Profile Widget */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2"><User size={18} className="text-indigo-600"/> HR Profile</h3>
              </div>
              
              <div className="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl bg-neutral-50">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-black shrink-0 shadow-inner">
                  {session.user?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <p className="font-bold text-neutral-900">{session.user?.name}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">{session.user?.email}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-6">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium flex gap-3 items-start">
                  <span className="text-amber-500 mt-0.5">⚠️</span>
                  <p>Leave Request and Payslip modules are currently under active development. Check back later.</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}