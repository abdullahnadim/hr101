'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, CalendarClock, Building, ArrowRight, 
  Loader2, Clock, AlertTriangle, CheckCircle, Award, 
  Briefcase, CalendarDays, UserPlus, Palmtree
} from 'lucide-react';

export default function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [pendingRooms, setPendingRooms] = useState<any[]>([]);
  const [milestoneAlerts, setMilestoneAlerts] = useState<any[]>([]);
  
  // New Modules State
  const [newHires, setNewHires] = useState<any[]>([]);
  const [awayToday, setAwayToday] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [empRes, leavesRes, roomsRes] = await Promise.all([
          fetch('/api/employees').catch(() => ({ ok: false, json: () => [] })),
          fetch('/api/leaves').catch(() => ({ ok: false, json: () => [] })),
          fetch('/api/conference').catch(() => ({ ok: false, json: () => [] }))
        ]);

        const empData = empRes.ok ? await empRes.json() : [];
        const leavesData = leavesRes.ok ? await leavesRes.json() : [];
        const roomsData = roomsRes.ok ? await roomsRes.json() : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Array.isArray(empData)) {
          setEmployees(empData);
          calculateMilestones(empData, today);
          
          // Calculate New Hires (joined in the last 30 days)
          const recent = empData.filter(emp => {
            if (emp.status !== 'ACTIVE' || !emp.joiningDate) return false;
            const joinDate = new Date(emp.joiningDate);
            const diffDays = Math.ceil((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30;
          }).sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime());
          setNewHires(recent);
        }

        if (Array.isArray(leavesData)) {
          setPendingLeaves(leavesData.filter((l: any) => l.status === 'PENDING'));
          
          // Calculate Who is Away Today
          const away = leavesData.filter((l: any) => {
            if (l.status !== 'APPROVED') return false;
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return today >= start && today <= end;
          });
          setAwayToday(away);
        }

        if (Array.isArray(roomsData)) {
          setPendingRooms(roomsData.filter((r: any) => r.status === 'PENDING'));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateMilestones = (empList: any[], today: Date) => {
    const alerts: any[] = [];

    empList.forEach(emp => {
      if (!emp.joiningDate || emp.status !== 'ACTIVE') return;

      const joinDate = new Date(emp.joiningDate);
      const diffTime = Math.abs(today.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const monthsSinceJoining = diffDays / 30.44;

      if (monthsSinceJoining >= 5.5 && monthsSinceJoining <= 6.5) {
        alerts.push({
          ...emp, type: 'PROBATION', title: '6-Month Probation Review',
          months: monthsSinceJoining.toFixed(1), urgency: monthsSinceJoining >= 6 ? 'HIGH' : 'MEDIUM'
        });
      } else if (monthsSinceJoining >= 3.5 && monthsSinceJoining <= 4.5) {
        alerts.push({
          ...emp, type: 'INTERNSHIP', title: '4-Month Internship Review',
          months: monthsSinceJoining.toFixed(1), urgency: monthsSinceJoining >= 4 ? 'HIGH' : 'MEDIUM'
        });
      }
    });

    alerts.sort((a, b) => (a.urgency === 'HIGH' ? -1 : 1));
    setMilestoneAlerts(alerts);
  };

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  const activeEmployeesCount = employees.filter(e => e.status === 'ACTIVE').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER & QUICK STATS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-70 -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">HR Command Center</h1>
          <p className="text-neutral-500 mt-1 font-medium">Manage pending approvals and track employee career milestones.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 relative z-10">
          <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active Headcount</p>
            <p className="text-3xl font-black text-blue-600 leading-none mt-1">{activeEmployeesCount}</p>
          </div>
          <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">New Hires</p>
            <p className="text-3xl font-black text-emerald-700 leading-none mt-1">{newHires.length}</p>
          </div>
          <div className="bg-white/60 backdrop-blur px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Away Today</p>
            <p className="text-3xl font-black text-amber-700 leading-none mt-1">{awayToday.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN: ACTION CENTER --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PENDING APPROVALS WIDGET */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Clock size={16} className="text-amber-500"/> Action Required
              </h2>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                {pendingLeaves.length + pendingRooms.length} Pending
              </span>
            </div>
            
            <div className="p-6 flex-1 bg-white">
              {pendingLeaves.length === 0 && pendingRooms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-neutral-400">
                  <CheckCircle size={40} className="mb-3 opacity-30 text-emerald-500" />
                  <p className="font-bold text-neutral-600">All Caught Up!</p>
                  <p className="text-sm mt-1">No pending leaves or room bookings require approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Leave Approvals */}
                  {pendingLeaves.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Leave Requests ({pendingLeaves.length})</h3>
                      {pendingLeaves.slice(0, 3).map((leave, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-amber-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                              <CalendarDays size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-neutral-900">{leave.employee?.name || 'Employee'}</p>
                              <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{leave.type || 'Leave Request'} • {leave.days} Days</p>
                            </div>
                          </div>
                          <Link href="/hr/leaves" className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Review</Link>
                        </div>
                      ))}
                      {pendingLeaves.length > 3 && <Link href="/hr/leaves" className="text-xs font-bold text-neutral-500 hover:text-black block text-center mt-2">View all {pendingLeaves.length} leave requests &rarr;</Link>}
                    </div>
                  )}

                  {/* Room Approvals */}
                  {pendingRooms.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-neutral-100">
                      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Conference Room Requests ({pendingRooms.length})</h3>
                      {pendingRooms.slice(0, 3).map((room, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-amber-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                              <Building size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-neutral-900">{room.roomName || 'Boardroom'}</p>
                              <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{room.employee?.name || 'Employee'} • {new Date(room.date || Date.now()).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Link href="/hr/conference" className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Review</Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: MILESTONES & ALERTS --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Award size={16} className="text-emerald-500"/> Milestone Alerts
              </h2>
              <p className="text-[10px] text-neutral-500 mt-1">Probation & Internship reviews</p>
            </div>
            
            <div className="p-6 flex-1 custom-scrollbar overflow-y-auto max-h-[500px]">
              {milestoneAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-neutral-400">
                  <Briefcase size={32} className="mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-medium text-center">No upcoming milestones.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestoneAlerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${alert.urgency === 'HIGH' ? 'border-red-200 bg-red-50/50' : 'border-neutral-100 bg-neutral-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${alert.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {alert.title}
                        </span>
                        {alert.urgency === 'HIGH' && <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                      <p className="font-bold text-sm text-neutral-900">{alert.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-neutral-500 truncate max-w-[120px]">{alert.position}</p>
                        <p className="text-[10px] font-mono font-bold text-neutral-700">{alert.months} Months</p>
                      </div>
                      <Link href={`/hr/employees/${alert.id}`} className="mt-3 block text-center text-xs font-bold text-neutral-600 hover:text-black bg-white border border-neutral-200 py-1.5 rounded-lg transition-colors shadow-sm">
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: NEW HIRES & ABSENCES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NEW HIRES MODULE */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <UserPlus size={16} className="text-blue-500"/> Recent Onboarding
              </h2>
              <p className="text-[10px] text-neutral-500 mt-1">Joined in the last 30 days</p>
            </div>
          </div>
          <div className="p-6 flex-1 custom-scrollbar overflow-y-auto max-h-[300px]">
            {newHires.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-neutral-400">
                <p className="text-sm font-medium">No new hires recently.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {newHires.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-neutral-900">{emp.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{emp.department} • {emp.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-widest">
                        {new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AWAY TODAY MODULE */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Palmtree size={16} className="text-emerald-500"/> Who's Away Today
              </h2>
              <p className="text-[10px] text-neutral-500 mt-1">Employees currently on approved leave</p>
            </div>
          </div>
          <div className="p-6 flex-1 custom-scrollbar overflow-y-auto max-h-[300px]">
            {awayToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-neutral-400">
                <p className="text-sm font-medium">Everyone is available today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {awayToday.map((leave, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-neutral-900">{leave.employee?.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{leave.employee?.department} • {leave.type}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest">
                        {leave.days} Days
                      </p>
                      <p className="text-[9px] text-neutral-400 mt-1 font-mono">
                        Until {new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}