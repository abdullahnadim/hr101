'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, X, AlertTriangle, Calendar, Clock, Building, Search, Loader2, CalendarRange, Info, ShieldCheck } from 'lucide-react';

export default function AdminConferenceDashboard() {
  // Data States
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [todaysBookings, setTodaysBookings] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form States
  const [loadingForm, setLoadingForm] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
      
      // Filter Pending/Conflict for the Queue
      setPendingBookings(data.filter((b: any) => b.status === 'PENDING' || b.status === 'CONFLICT'));
      
      // Filter Approved for Today's Schedule
      setTodaysBookings(data.filter((b: any) => {
        const bookingDate = b.date.split('T')[0];
        return b.status === 'APPROVED' && bookingDate === localISOTime;
      }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)));
      
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete Logic
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        const filtered = data.filter((emp: any) => 
          emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) || emp.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
        setShowDropdown(true);
      } catch (error) {}
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const selectEmployee = (emp: any) => {
    setSearchQuery(`${emp.employeeCode} - ${emp.name}`);
    setFormData({ ...formData, employeeId: emp.id, teamName: emp.department || '' }); 
    setShowDropdown(false);
  };

  // Action Handlers
  const handleApprovalAction = async (id: string, status: string, newTime?: string) => {
    setActionLoading(id);
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTime ? { status, startTime: newTime } : { status })
    });
    setActionLoading(null);
    fetchData();
  };

  const handleAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Please select a valid employee from the dropdown.");
    
    setLoadingForm(true);
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, status: 'APPROVED' }) // Admin bypasses queue
    });
    setLoadingForm(false);
    
    setFormData({ employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30 });
    setSearchQuery('');
    setIsCustomDuration(false);
    fetchData(); 
  };

  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const format = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${format(start)} - ${format(end)}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" /> Room Administration
        </h1>
        <p className="text-neutral-500 mt-1">Manage pending requests, view the master schedule, and book the room directly.</p>
      </div>

      {/* TOP SECTION: Approval Queue */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="font-bold text-neutral-900">Pending Approvals ({pendingBookings.length})</h2>
        </div>
        <div className="p-6">
          {loadingSchedule ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
          ) : pendingBookings.length === 0 ? (
            <p className="text-neutral-500 text-sm">The queue is currently empty.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingBookings.map(b => (
                <div key={b.id} className={`p-4 rounded-xl border ${b.status === 'CONFLICT' ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-200'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900">{b.teamName}: {b.reason}</h3>
                      <p className="text-xs text-neutral-500 mt-1">Requested by: {b.employee?.name} ({b.employee?.employeeCode})</p>
                      
                      <div className="mt-3 text-sm font-medium flex items-center gap-2">
                        <span>{new Date(b.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <input type="time" defaultValue={b.startTime} id={`time-${b.id}`} className="border border-neutral-300 rounded px-2 py-1 text-sm focus:ring-black outline-none" />
                        <span>({b.durationMinutes}m)</span>
                      </div>
                      
                      {b.status === 'CONFLICT' && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-2 font-bold bg-red-100 p-2 rounded">
                          <AlertTriangle size={14} /> Time conflict detected. Adjust the start time above before approving.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleApprovalAction(b.id, 'APPROVED', (document.getElementById(`time-${b.id}`) as HTMLInputElement).value)} disabled={actionLoading === b.id} className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition flex justify-center" title="Approve">
                        {actionLoading === b.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      </button>
                      <button onClick={() => handleApprovalAction(b.id, 'REJECTED')} disabled={actionLoading === b.id} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition flex justify-center" title="Reject">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BOTTOM LEFT: Admin Booking Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm h-fit">
          <h2 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <Building size={18} className="text-blue-600"/> Direct Admin Booking
          </h2>
          <form onSubmit={handleAdminBooking} className="space-y-5">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Requester ID or Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                <input 
                  type="text" value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setFormData({ ...formData, employeeId: '' }); }}
                  placeholder="Type ID (e.g. f00058) or Name..." 
                  className="w-full pl-10 p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" required
                />
              </div>
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((emp) => (
                    <li key={emp.id} onClick={() => selectEmployee(emp)} className="px-4 py-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0">
                      <div className="font-bold text-neutral-900">{emp.name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{emp.employeeCode} • {emp.department}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Team / Department</label>
                <input type="text" required value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Meeting Agenda</label>
                <input type="text" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-10 p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                  <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full pl-10 p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Duration</label>
                {!isCustomDuration ? (
                  <select required value={formData.durationMinutes} onChange={e => { if (e.target.value === 'custom') setIsCustomDuration(true); else setFormData({...formData, durationMinutes: parseInt(e.target.value)}); }} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white">
                    <option value={15}>15 Minutes</option><option value={30}>30 Minutes</option><option value={45}>45 Minutes</option><option value={60}>1 Hour</option><option value={90}>1.5 Hours</option><option value="custom">Custom...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="number" min="5" required value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Mins" />
                    <button type="button" onClick={() => { setIsCustomDuration(false); setFormData({...formData, durationMinutes: 30}); }} className="text-xs text-neutral-500 hover:text-black">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loadingForm} className="w-full mt-4 bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors">
              {loadingForm ? <Loader2 className="animate-spin" size={18} /> : 'Book & Auto-Approve'}
            </button>
          </form>
        </div>

        {/* BOTTOM RIGHT: Today's Schedule */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden h-fit">
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center gap-2">
            <CalendarRange size={18} className="text-neutral-600" />
            <h2 className="font-bold text-neutral-900">Today's Schedule</h2>
          </div>
          <div className="p-6">
            {loadingSchedule ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
            ) : todaysBookings.length === 0 ? (
              <div className="text-center text-neutral-500 py-8 flex flex-col items-center gap-2">
                <Info size={24} className="text-neutral-300" />
                <p className="text-sm">No meetings scheduled today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysBookings.map((b) => (
                  <div key={b.id} className="relative pl-4 border-l-2 border-emerald-500">
                    <div className="text-xs font-bold text-emerald-600 mb-0.5">
                      {formatTimeRange(b.startTime, b.durationMinutes)}
                    </div>
                    <div className="font-bold text-neutral-900">{b.teamName}</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-mono uppercase">By: {b.employee?.name}</div>
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