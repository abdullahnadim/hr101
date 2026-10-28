'use client';
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Calendar, Settings, CalendarClock, 
  Briefcase, Building, LogIn, LogOut, SlidersHorizontal, Monitor, 
  Calculator, Menu, X, UploadCloud, FileSpreadsheet, ShieldCheck, ConciergeBell
} from "lucide-react";

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!session;
  
  // --- USER PROFILE DATA ---
  const userEmail = session?.user?.email || '';
  const username = userEmail.split('@')[0] || 'Guest';
  const roleName = (session?.user as any)?.roleName || 'Unassigned';
  const userPermissions = (session?.user as any)?.permissions || [];
  
  // --- THE ADMIN BYPASS ---
  const isAdmin = roleName === 'ADMIN' || roleName === 'Super Admin';
  const canRead = (module: string) => isAdmin || userPermissions.includes(`${module}:READ`);

  const canViewHR = canRead('HR_HUB');
  const canViewRecruitment = canRead('RECRUITMENT');
  const canViewPayroll = canRead('PAYROLL');
  const canViewIT = canRead('IT_ASSETS');
  const canViewAccounts = canRead('ACCOUNTS');
  const canViewAudit = canRead('AUDIT');
  const canViewReception = canRead('RECEPTION');
  const canViewSettings = canRead('SETTINGS');

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const linkClass = (path: string) => `flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors ${isActive(path) ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'}`;

  const NavigationLinks = () => (
    <div className="space-y-6">
      
      <div className="space-y-1">
        <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Workspace</div>
        <Link onClick={() => setMobileMenuOpen(false)} href="/" className={linkClass('/')}><LayoutDashboard size={18} /> Employee Hub</Link>
        <Link onClick={() => setMobileMenuOpen(false)} href="/conference" className={linkClass('/conference')}><Building size={18} /> Book Room</Link>
      </div>

      {isAuthenticated && canViewRecruitment && (
        <div className="space-y-1">
          <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Recruitment</div>
          <Link onClick={() => setMobileMenuOpen(false)} href="/recruitment" className={linkClass('/recruitment')}><LayoutDashboard size={18} /> ATS Dashboard</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/recruitment/candidates" className={linkClass('/recruitment/candidates')}><Users size={18} /> Candidates</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/recruitment/calendar" className={linkClass('/recruitment/calendar')}><Calendar size={18} /> Interviews</Link>
          {canViewSettings && (
            <Link onClick={() => setMobileMenuOpen(false)} href="/recruitment/settings" className={linkClass('/recruitment/settings')}><SlidersHorizontal size={18} /> ATS Settings</Link>
          )}
        </div>
      )}

      {isAuthenticated && (canViewHR || canViewPayroll || canViewIT || canViewAccounts || canViewAudit || canViewReception) && (
        <div className="space-y-1">
          <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Departments</div>
          
          {canViewHR && (
            <>
              <Link onClick={() => setMobileMenuOpen(false)} href="/admin/employees" className={linkClass('/admin/employees')}><Briefcase size={18} /> HR Directory</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/admin/leaves" className={linkClass('/admin/leaves')}><Calendar size={18} /> Leaves</Link>
            </>
          )}
          
          {canViewPayroll && (
            <>
              <Link onClick={() => setMobileMenuOpen(false)} href="/admin/payroll" className={linkClass('/admin/payroll')}><Calculator size={18} /> Payroll</Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/admin/attendance/import" className={linkClass('/admin/attendance/import')}><UploadCloud size={18} /> Import Attendance</Link>
            </>
          )}

          {canViewAccounts && <Link onClick={() => setMobileMenuOpen(false)} href="/accounts" className={linkClass('/accounts')}><FileSpreadsheet size={18} /> Accounts</Link>}
          {canViewAudit && <Link onClick={() => setMobileMenuOpen(false)} href="/audit" className={linkClass('/audit')}><ShieldCheck size={18} /> Audit</Link>}
          {canViewReception && <Link onClick={() => setMobileMenuOpen(false)} href="/reception" className={linkClass('/reception')}><ConciergeBell size={18} /> Reception Desk</Link>}
          {canViewIT && <Link onClick={() => setMobileMenuOpen(false)} href="/admin/it" className={linkClass('/admin/it')}><Monitor size={18} /> IT Assets</Link>}
          
          {(canViewHR || canViewIT || canViewReception) && (
            <Link onClick={() => setMobileMenuOpen(false)} href="/admin/conference" className={linkClass('/admin/conference')}><CalendarClock size={18} /> Room Admin</Link>
          )}
        </div>
      )}

      {isAuthenticated && canViewSettings && (
        <div className="space-y-1">
          <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">System</div>
          <Link onClick={() => setMobileMenuOpen(false)} href="/admin/settings" className={linkClass('/admin/settings')}><Settings size={18} /> Platform Settings</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/admin/settings/payroll" className={linkClass('/admin/settings/payroll')}><SlidersHorizontal size={18} /> Payroll Settings</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/admin/settings/roles" className={linkClass('/admin/settings/roles')}><ShieldCheck size={18} /> Roles & Access</Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col shrink-0 z-20">
        
        {/* UPDATED: Dynamic User Profile Header */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-100 bg-neutral-50/50">
          {isAuthenticated ? (
            <>
              <div className="h-8 w-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                {username.slice(0, 2)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm tracking-wide text-neutral-900 truncate max-w-[140px]">{username}</span>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase truncate">{roleName}</span>
              </div>
            </>
          ) : (
            <>
              <div className="h-8 w-8 bg-black rounded-md mr-3 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">FA</div>
              <span className="font-bold text-sm tracking-wide text-neutral-900">FAL Enterprise</span>
            </>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <NavigationLinks />
        </nav>

        <div className="p-4 border-t border-neutral-100">
          {isAuthenticated ? (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 rounded-md hover:bg-neutral-50 transition-colors">
              <LogIn size={18} /> Staff Login
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-20 md:pb-0 relative">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center h-16 z-40 px-2 safe-area-pb shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <Link href="/" className={`flex flex-col items-center gap-1 p-2 ${pathname === '/' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'}`}>
          <LayoutDashboard size={20} /><span className="text-[10px]">Hub</span>
        </Link>
        <Link href="/conference" className={`flex flex-col items-center gap-1 p-2 ${pathname.startsWith('/conference') && !pathname.startsWith('/admin/conference') ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'}`}>
          <Building size={20} /><span className="text-[10px]">Rooms</span>
        </Link>
        
        {isAuthenticated && canViewRecruitment && (
          <Link href="/recruitment" className={`flex flex-col items-center gap-1 p-2 ${pathname.startsWith('/recruitment') ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'}`}>
            <Users size={20} /><span className="text-[10px]">ATS</span>
          </Link>
        )}
        
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex flex-col items-center gap-1 p-2 ${mobileMenuOpen ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'}`}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-6 pb-24 px-6 overflow-y-auto slide-in-from-bottom-full animate-in duration-200">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
            {isAuthenticated ? (
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                  {username.slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-neutral-900 leading-tight">{username}</span>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">{roleName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-8 w-8 bg-black rounded-md mr-3 flex items-center justify-center text-white text-[10px] font-bold">FA</div>
                <span className="font-bold text-lg">Menu</span>
              </div>
            )}
          </div>
          
          <NavigationLinks />

          <div className="mt-8 pt-6 border-t border-neutral-100">
            {isAuthenticated ? (
              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl">
                <LogOut size={18} /> Sign Out
              </button>
            ) : (
              <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold text-white bg-black rounded-xl">
                <LogIn size={18} /> Staff Login
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}