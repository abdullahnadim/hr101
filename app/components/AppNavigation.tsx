// app/components/AppNavigation.tsx
'use client';
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings, CalendarClock, Briefcase, Building, LogIn, LogOut } from "lucide-react";

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Role Checks
  const isAuthenticated = !!session;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'HR_MANAGER';

  // Helper for active styling
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const linkClass = (path: string) => `flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${isActive(path) ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'}`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-neutral-100">
          <div className="h-6 w-6 bg-black rounded-md mr-3"></div>
          <span className="font-semibold text-sm tracking-wide">HR 101</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          
          {/* Public / General Workspace */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Workspace</div>
            <Link href="/" className={pathname === '/' ? linkClass('/') : 'flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-neutral-600 hover:bg-neutral-50'}><LayoutDashboard size={18} className="text-neutral-400" /> Hub</Link>
            <Link href="/conference" className={pathname === '/conference' ? linkClass('/conference') : 'flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-neutral-600 hover:bg-neutral-50'}><Building size={18} className="text-neutral-400" /> Book Room</Link>
          </div>

          {/* Secure HR Modules */}
          {isAuthenticated && (
            <>
              <div className="space-y-1">
                <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Recruitment (ATS)</div>
                <Link href="/recruitment" className={pathname === '/recruitment' ? linkClass('/recruitment') : 'flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-neutral-600 hover:bg-neutral-50'}><LayoutDashboard size={18} className="text-neutral-400" /> ATS Dashboard</Link>
                <Link href="/recruitment/candidates" className={linkClass('/recruitment/candidates')}><Users size={18} className="text-neutral-400" /> Candidates</Link>
                <Link href="/recruitment/calendar" className={linkClass('/recruitment/calendar')}><Calendar size={18} className="text-neutral-400" /> Interviews</Link>
              </div>

              <div className="space-y-1">
                <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Internal HR</div>
                <Link href="/admin/employees" className={linkClass('/admin/employees')}><Briefcase size={18} className="text-neutral-400" /> Directory</Link>
                {isAdmin && (
                  <Link href="/admin/conference" className={linkClass('/admin/conference')}><CalendarClock size={18} className="text-neutral-400" /> Room Admin</Link>
                )}
              </div>
            </>
          )}

          {/* System Module */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">System</div>
              <Link href="/settings" className={linkClass('/settings')}><Settings size={18} className="text-neutral-400" /> Settings</Link>
            </div>
          )}
        </nav>

        {/* Dynamic Auth Button */}
        <div className="p-4 border-t border-neutral-100">
          {isAuthenticated ? (
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-50 transition-colors">
              <LogIn size={18} /> Admin Login
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0">
        {children}
        <footer className="w-full text-center py-6 mt-auto text-xs font-medium text-neutral-400">Developed by Mir</footer>
      </main>

      {/* Mobile Bottom Navigation (Conditionally Rendered) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center h-16 z-50 px-2 safe-area-pb">
        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black"><LayoutDashboard size={20} /><span className="text-[10px] font-medium">Hub</span></Link>
        <Link href="/conference" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black"><Building size={20} /><span className="text-[10px] font-medium">Rooms</span></Link>
        {isAuthenticated && (
          <>
            <Link href="/recruitment" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black"><Users size={20} /><span className="text-[10px] font-medium">ATS</span></Link>
            <Link href="/admin/employees" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black"><Briefcase size={20} /><span className="text-[10px] font-medium">Staff</span></Link>
          </>
        )}
      </nav>
    </>
  );
}