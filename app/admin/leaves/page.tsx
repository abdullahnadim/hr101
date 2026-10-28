'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, Check, X, Clock, AlertCircle, FileText, 
  Search, Filter, Loader2, User 
} from 'lucide-react';

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaves');
      if (res.ok) setLeaves(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setLeaves(leaves.map(l => l.id === id ? { ...l, status: newStatus } : l));
      } else {
        alert("Failed to update status. You may lack sufficient RBAC permissions.");
      }
    } catch (error) {
      alert("An error occurred.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
  const historyLeaves = leaves.filter(l => l.status !== 'PENDING');
  const displayLeaves = activeTab === 'PENDING' ? pendingLeaves : historyLeaves;

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} /> Leave Management
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review and manage employee time-off requests.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Tabs & Controls */}
        <div className="border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-center px-4 pt-4 gap-4">
          <div className="flex space-x-6 px-2">
            <button 
              onClick={() => setActiveTab('PENDING')} 
              className={`pb-4 text-sm font-bold transition-colors border-b-2 relative ${activeTab === 'PENDING' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'}`}
            >
              Pending Approvals
              {pendingLeaves.length > 0 && (
                <span className="absolute -top-1 -right-4 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingLeaves.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')} 
              className={`pb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'HISTORY' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'}`}
            >
              Leave History
            </button>
          </div>
          <div className="flex items-center gap-2 pb-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2 text-neutral-400" size={16} />
              <input type="text" placeholder="Search employee..." className="w-full pl-9 pr-4 py-1.5 border border-neutral-200 rounded-lg text-sm focus:border-black outline-none" />
            </div>
            <button className="p-1.5 border border-neutral-200 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-50"><Filter size={18} /></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={28}/></div>
          ) : displayLeaves.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-20">
              {activeTab === 'PENDING' ? <Check size={48} className="text-emerald-200 mb-4" /> : <FileText size={48} className="text-neutral-200 mb-4" />}
              <p className="font-medium text-neutral-900">{activeTab === 'PENDING' ? "All caught up!" : "No history found."}</p>
              <p className="text-sm">{activeTab === 'PENDING' ? "There are no pending leave requests." : "No processed requests yet."}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 overflow-hidden">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">{leave.employee?.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{leave.employee?.employeeCode} • {leave.employee?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-700">{leave.leaveType}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-900">{leave.totalDays} Day(s)</div>
                      <div className="text-[10px] text-neutral-500">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-neutral-600" title={leave.reason}>{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {leave.status === 'PENDING' && <Clock size={12} />}
                        {leave.status === 'APPROVED' && <Check size={12} />}
                        {leave.status === 'REJECTED' && <X size={12} />}
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {leave.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(leave.id, 'APPROVED')}
                            disabled={actionLoading === leave.id}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === leave.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button 
                            onClick={() => handleAction(leave.id, 'REJECTED')}
                            disabled={actionLoading === leave.id}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button className="text-xs font-bold text-neutral-400 hover:text-black transition-colors">Details</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}