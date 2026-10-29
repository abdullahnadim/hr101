'use client';
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  // Workspace
  LayoutDashboard, Building2, 
  // HR
  Users, Contact2, Palmtree,
  // Recruitment
  Briefcase, PieChart, UsersRound, CalendarCheck2, SlidersHorizontal,
  // Payroll & Finance
  Wallet, FileSpreadsheet, FileUp, Receipt,
  // Admin & IT
  Monitor, ShieldCheck, ConciergeBell, CalendarClock,
  // System
  Settings, LogIn, LogOut, Menu, X, ChevronDown, UserCircle
} from "lucide-react";

// --- PREMIUM COLLAPSIBLE NAVIGATION GROUP ---
const NavGroup = ({ title, icon: Icon, basePath, pathname, children }: any) => {
  const isActive = pathname.startsWith(basePath) && basePath !== '/';
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  return (
    <div className="space-y-1">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 group ${
          isActive 
            ? 'bg-neutral-100 text-neutral-900' 
            : 'text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={`transition-colors ${isActive ? "text-blue-600" : "text-neutral-400 group-hover:text-neutral-600"}`} />
          <span>{title}</span>
        </div>
        <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Sub-menu with vertical tracking line */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="pl-6 ml-3 border-l border-neutral-200 space-y-1 py-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!session;
  const userEmail = session?.user?.email || '';
  const username = userEmail.split('@')[0] || 'Guest';
  const roleName = (session?.user as any)?.roleName || 'Unassigned';
  const userPermissions = (session?.user as any)?.permissions || [];
  
  // --- CENTRAL RBAC ENGINE ---
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

  const closeMobile = () => setMobileMenuOpen(false);

  // --- STYLING UTILS ---
  const isActiveExact = (path: string) => pathname === path;
  
  const singleLinkClass = (path: string) => `flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 group ${
    isActiveExact(path) || (pathname.startsWith(path) && path !== '/')
      ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10' 
      : 'text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900'
  }`;

  const subLinkClass = (path: string) => `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
    isActiveExact(path) 
      ? 'bg-blue-50/80 text-blue-700 font-semibold relative after:absolute after:left-[-13px] after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full' 
      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
  }`;

  // --- NAVIGATION DATA ---
  const NavigationLinks = () => (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      
      {/* 1. WORKSPACE */}
      <div className="space-y-1">
        <div className="px-3 mb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Workspace</div>
        <Link onClick={closeMobile} href="/" className={singleLinkClass('/')}>
          <LayoutDashboard size={18} className={isActiveExact('/') ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} /> 
          Dashboard
        </Link>
        <Link onClick={closeMobile} href="/conference" className={singleLinkClass('/conference')}>
          <Building2 size={18} className={pathname.startsWith('/conference') ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} /> 
          Book Room
        </Link>
      </div>

      {/* 2. DEPARTMENTS */}
      {isAuthenticated && (canViewHR || canViewRecruitment || canViewPayroll || canViewIT || canViewAccounts || canViewAudit || canViewReception) && (
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-6">Departments</div>
          
          {canViewHR && (
            <NavGroup title="Human Resources" icon={Users} basePath="/hr" pathname={pathname}>
              <Link onClick={closeMobile} href="/hr/employees" className={subLinkClass('/hr/employees')}><Contact2 size={14} /> Directory</Link>
              <Link onClick={closeMobile} href="/hr/leaves" className={subLinkClass('/hr/leaves')}><Palmtree size={14} /> Leaves</Link>
              {/* NEW: Room Admin moved to HR */}
              <Link onClick={closeMobile} href="/hr/conference" className={subLinkClass('/hr/conference')}><CalendarClock size={14} /> Room Admin</Link>
            </NavGroup>
          )}

          {canViewRecruitment && (
            <NavGroup title="Recruitment" icon={Briefcase} basePath="/recruitment" pathname={pathname}>
              <Link onClick={closeMobile} href="/recruitment" className={subLinkClass('/recruitment')}><PieChart size={14} /> Overview</Link>
              <Link onClick={closeMobile} href="/recruitment/candidates" className={subLinkClass('/recruitment/candidates')}><UsersRound size={14} /> Candidates</Link>
              <Link onClick={closeMobile} href="/recruitment/calendar" className={subLinkClass('/recruitment/calendar')}><CalendarCheck2 size={14} /> Interviews</Link>
              {canViewSettings && (
                <Link onClick={closeMobile} href="/recruitment/settings" className={subLinkClass('/recruitment/settings')}><Settings size={14} /> ATS Settings</Link>
              )}
            </NavGroup>
          )}

          {canViewPayroll && (
            <NavGroup title="Finance & Payroll" icon={Wallet} basePath="/payroll" pathname={pathname}>
              <Link onClick={closeMobile} href="/payroll" className={subLinkClass('/payroll')}><FileSpreadsheet size={14} /> Payroll Hub</Link>
              <Link onClick={closeMobile} href="/payroll/attendance/import" className={subLinkClass('/payroll/attendance/import')}><FileUp size={14} /> Attendance</Link>
            </NavGroup>
          )}

          {canViewAccounts && (
            <Link onClick={closeMobile} href="/accounts" className={singleLinkClass('/accounts')}>
              <FileSpreadsheet size={18} className={pathname.startsWith('/accounts') ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} /> Accounts
            </Link>
          )}

          {canViewReception && (
            <NavGroup title="Front Desk" icon={ConciergeBell} basePath="/reception" pathname={pathname}>
              <Link onClick={closeMobile} href="/reception" className={subLinkClass('/reception')}><LayoutDashboard size={14} /> Reception Hub</Link>
              <Link onClick={closeMobile} href="/reception/bill" className={subLinkClass('/reception/bill')}><Receipt size={14} /> Bill Logbook</Link>
            </NavGroup>
          )}

          {canViewIT && (
            <Link onClick={closeMobile} href="/it" className={singleLinkClass('/it')}>
              <Monitor size={18} className={pathname.startsWith('/it') ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} /> IT Assets
            </Link>
          )}

          {canViewAudit && (
            <Link onClick={closeMobile} href="/audit" className={singleLinkClass('/audit')}>
              <ShieldCheck size={18} className={pathname.startsWith('/audit') ? "text-neutral-300" : "text-neutral-400 group-hover:text-neutral-600"} /> Audit Log
            </Link>
          )}
        </div>
      )}

      {/* 3. CONFIGURATION & SYSTEM */}
      {isAuthenticated && canViewSettings && (
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-6">Configuration</div>
          <NavGroup title="System & Access" icon={Settings} basePath="/configuration" pathname={pathname}>
            <Link onClick={closeMobile} href="/configuration/roles" className={subLinkClass('/configuration/roles')}><ShieldCheck size={14} /> Roles & Permissions</Link>
            <Link onClick={closeMobile} href="/configuration" className={subLinkClass('/configuration')}><SlidersHorizontal size={14} /> Global Settings</Link>
            <Link onClick={closeMobile} href="/configuration/vendors" className={subLinkClass('/configuration/vendors')}><Building2 size={14} /> Vendor Directory</Link>
            <Link onClick={closeMobile} href="/configuration/payroll" className={subLinkClass('/configuration/payroll')}><Wallet size={14} /> Payroll Config</Link>
          </NavGroup>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR (FAL Enterprise Standard)                        */}
      {/* ============================================================== */}
      <aside className="hidden md:flex w-[260px] bg-[#FDFDFD] border-r border-neutral-200/80 flex-col shrink-0 z-20 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        
        {/* Brand Header */}
        <div className="h-[72px] flex items-center px-6 border-b border-neutral-100 bg-white">
          <div className="h-8 w-8 bg-black rounded-xl mr-3 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-tighter shadow-md shadow-black/10">FA</div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-neutral-900 leading-none">FAL Enterprise</span>
            <span className="text-[10px] font-medium text-neutral-500 mt-1 tracking-widest uppercase">Workspace</span>
          </div>
        </div>
        
        {/* Scrollable Nav Area */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <NavigationLinks />
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 bg-neutral-50/50 border-t border-neutral-100">
          {isAuthenticated ? (
            <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition-all duration-300">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-inner">
                  {username.slice(0, 2)}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-sm text-neutral-900 truncate leading-tight">{username}</span>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase truncate tracking-wider">{roleName}</span>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-black rounded-lg hover:bg-neutral-800 transition-all shadow-md active:scale-95">
              <LogIn size={16} /> Staff Login
            </Link>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT WRAPPER                                           */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-20 md:pb-0 relative bg-white">
        {children}
      </main>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (iOS / Modern Feel)               */}
      {/* ============================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 flex justify-around items-center h-[72px] z-40 px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        <Link href="/" className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all duration-200 ${pathname === '/' ? 'text-black scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}>
          <LayoutDashboard size={22} className={pathname === '/' ? 'fill-neutral-100' : ''} />
          <span className={`text-[10px] ${pathname === '/' ? 'font-bold' : 'font-medium'}`}>Hub</span>
        </Link>
        
        <Link href="/conference" className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all duration-200 ${pathname.startsWith('/conference') && !pathname.startsWith('/admin') ? 'text-black scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}>
          <Building2 size={22} className={pathname.startsWith('/conference') && !pathname.startsWith('/admin') ? 'fill-neutral-100' : ''} />
          <span className={`text-[10px] ${pathname.startsWith('/conference') && !pathname.startsWith('/admin') ? 'font-bold' : 'font-medium'}`}>Rooms</span>
        </Link>
        
        {/* Dynamic Center Tab */}
        {isAuthenticated && canViewRecruitment ? (
          <Link href="/recruitment" className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all duration-200 ${pathname.startsWith('/recruitment') ? 'text-blue-600 scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <Briefcase size={22} className={pathname.startsWith('/recruitment') ? 'fill-blue-50' : ''} />
            <span className={`text-[10px] ${pathname.startsWith('/recruitment') ? 'font-bold' : 'font-medium'}`}>ATS</span>
          </Link>
        ) : isAuthenticated && canViewHR ? (
          <Link href="/hr/employees" className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all duration-200 ${pathname.startsWith('/hr') ? 'text-blue-600 scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}>
            <Users size={22} className={pathname.startsWith('/hr') ? 'fill-blue-50' : ''} />
            <span className={`text-[10px] ${pathname.startsWith('/hr') ? 'font-bold' : 'font-medium'}`}>HR</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-2 w-16 text-neutral-400">
            <UserCircle size={22} />
            <span className="text-[10px] font-medium">Me</span>
          </div>
        )}
        
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all duration-200 ${mobileMenuOpen ? 'text-black scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          <span className={`text-[10px] ${mobileMenuOpen ? 'font-bold' : 'font-medium'}`}>Menu</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* MOBILE FULL-SCREEN MENU (Glassmorphism Slide-up)               */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white/95 backdrop-blur-md pt-8 pb-32 px-6 overflow-y-auto slide-in-from-bottom-full animate-in duration-300 ease-out">
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-base font-bold uppercase shadow-lg shadow-blue-900/20">
                  {username.slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl text-neutral-900 tracking-tight">{username}</span>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{roleName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-black rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg">FA</div>
                <span className="font-bold text-xl tracking-tight">FAL Enterprise</span>
              </div>
            )}
          </div>
          
          <NavigationLinks />

          <div className="mt-8 pt-8 border-t border-neutral-200">
            {isAuthenticated ? (
              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex justify-center items-center gap-2 px-4 py-4 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors active:scale-95">
                <LogOut size={18} /> Sign Out securely
              </button>
            ) : (
              <Link onClick={closeMobile} href="/login" className="w-full flex justify-center items-center gap-2 px-4 py-4 text-sm font-bold text-white bg-black hover:bg-neutral-800 rounded-xl transition-all shadow-xl shadow-black/10 active:scale-95">
                <LogIn size={18} /> Staff Login
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}