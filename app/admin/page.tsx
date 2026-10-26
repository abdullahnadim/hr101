'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Building, CalendarClock, ArrowRight, 
  DoorOpen, Loader2, Clock, PlusCircle, CheckCircle2 
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeRooms: 0,
    pendingBookings: 0,
  });
  
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [empRes, roomRes, bookingRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/rooms'),
          fetch('/api/bookings')
        ]);

        const employees = await empRes.json();
        const rooms = await roomRes.json();
        const bookings = await bookingRes.json();

        const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE');
        const activeRooms = rooms.filter((r: any) => r.status === 'ACTIVE');
        const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'CONFLICT');

        setStats({
          totalEmployees: activeEmployees.length,
          activeRooms: activeRooms.length,
          pendingBookings: pendingBookings.length,
        });

        setRecentEmployees(employees.slice(0, 4)); // Get latest 4
        setPendingRequests(pendingBookings.slice(0, 4)); // Get latest 4 pending

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm font-medium text-neutral-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome back, Admin</h1>
          <p className="text-neutral-500 mt-1">Here is what is happening across your organization today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/employees" className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <PlusCircle size={16} /> Add Employee
          </Link>
          <Link href="/admin/conference" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            <CalendarClock size={16} /> Review Bookings
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Active Employees</p>
            <h2 className="text-3xl font-black text-neutral-900 mt-1">{stats.totalEmployees}</h2>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <DoorOpen size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Active Workspaces</p>
            <h2 className="text-3xl font-black text-neutral-900 mt-1">{stats.activeRooms}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${stats.pendingBookings > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {stats.pendingBookings > 0 ? <Clock size={28} /> : <CheckCircle2 size={28} />}
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Pending Approvals</p>
            <h2 className="text-3xl font-black text-neutral-900 mt-1">{stats.pendingBookings}</h2>
          </div>
        </div>
      </div>

      {/* Two-Column Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Action Required: Pending Bookings */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <CalendarClock size={18} className="text-amber-500" /> Action Required
            </h3>
            <Link href="/admin/conference" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-6 flex-1">
            {pendingRequests.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center py-10 space-y-3">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <p className="text-sm font-medium text-neutral-500">You're all caught up!<br/>No pending booking requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 shadow-sm transition-colors flex justify-between items-center gap-4">
                    <div>
                      <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                        {req.employee?.name || 'Unknown'} <span className="text-neutral-300">•</span> <span className="text-indigo-600">{req.roomName}</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {new Date(req.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {req.startTime}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.status === 'CONFLICT' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Hires / Employees */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <Building size={18} className="text-blue-600" /> Recent Employees
            </h3>
            <Link href="/admin/employees" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Directory <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-6 flex-1">
            {recentEmployees.length === 0 ? (
              <div className="h-full flex justify-center items-center text-center py-10">
                <p className="text-sm font-medium text-neutral-500">No employees found in the system.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmployees.map(emp => (
                  <Link key={emp.id} href={`/admin/employees/${emp.id}`} className="block p-4 rounded-xl border border-neutral-100 bg-white hover:border-blue-100 hover:bg-blue-50/50 shadow-sm transition-colors">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <div className="font-bold text-neutral-900 text-sm">{emp.name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{emp.position} • {emp.department}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {emp.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}