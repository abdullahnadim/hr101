'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, Check, X, Clock, FileText, 
  Search, Filter, Loader2, User, AlertCircle
} from 'lucide-react';

// Define strict types for professional engineering
interface EmployeeSnippet {
  name: string;
  employeeCode: string;
  department: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee?: EmployeeSnippet;
}

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaves');
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this leave request?`)) return;
    
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
      alert("An error occurred while updating the request.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter logic: Separate by tab, then filter by search query
  const filteredLeaves = leaves.filter(leave => {
    const matchesTab = activeTab === 'PENDING' ? leave.status === 'PENDING' : leave.status !== 'PENDING';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      leave.employee?.name.toLowerCase().includes(searchLower) ||
      leave.employee?.employeeCode.toLowerCase().includes(searchLower) ||
      leave.leaveType.toLowerCase().includes(searchLower);
    
    return matchesTab && matchesSearch;
  });

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2 tracking-tight">
            <Calendar className="text-blue-600" size={24} /> 
            Leave Management
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review, approve, and track employee time-off requests.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* --- TABS & CONTROLS --- */}
        <div className="border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-center px-6 pt-4 gap-4">
          <div className="flex space-x-6 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('PENDING')} 
              className={`pb-4 text-sm font-bold transition-all border-b-2 relative ${
                activeTab === 'PENDING' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
              }`}
            >
              Pending Approvals
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')} 
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'HISTORY' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
              }`}
            >
              Leave History
            </button>
          </div>
          
          <div className="flex items-center gap-3 pb-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Search employee or type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-shadow" 
              />
            </div>
            <button className="p-2 border border-neutral-200 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors shadow-sm" title="Filter options">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* --- CONTENT AREA / TABLE --- */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-400 space-y-3">
              <Loader2 className="animate-spin" size={28}/>
              <span className="text-sm font-medium">Fetching requests...</span>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-400 py-20 animate-in zoom-in-95">
              {activeTab === 'PENDING' ? (
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                  <Check size={32} className="text-emerald-500" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                  <FileText size={32} className="text-neutral-300" />
                </div>
              )}
              <h3 className="text-lg font-bold text-neutral-900">
                {activeTab === 'PENDING' ? "All caught up!" : "No history found."}
              </h3>
              <p className="text-sm mt-1">
                {searchQuery 
                  ? "No requests match your current search." 
                  : activeTab === 'PENDING' 
                    ? "There are no pending leave requests to review." 
                    : "No processed requests exist in the system yet."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Duration & Dates</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-neutral-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900">{leave.employee?.name || 'Unknown User'}</span>
                          <span className="text-[11px] text-neutral-500 font-mono mt-0.5">
                            {leave.employee?.employeeCode || 'N/A'} • {leave.employee?.department || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-900">{leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}</span>
                        <span className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-neutral-600 text-xs" title={leave.reason}>
                        {leave.reason || <span className="italic text-neutral-400">No reason provided</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                        leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {leave.status === 'PENDING' && <Clock size={12} />}
                        {leave.status === 'APPROVED' && <Check size={12} />}
                        {leave.status === 'REJECTED' && <X size={12} />}
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {leave.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleAction(leave.id, 'APPROVED')}
                            disabled={actionLoading === leave.id}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            title="Approve Request"
                          >
                            {actionLoading === leave.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button 
                            onClick={() => handleAction(leave.id, 'REJECTED')}
                            disabled={actionLoading === leave.id}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            title="Reject Request"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors underline-offset-4 hover:underline">
                          View Details
                        </button>
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