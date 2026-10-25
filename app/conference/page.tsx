'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, Building, Search, Loader2, CalendarRange, Info } from 'lucide-react';
import { useSession } from 'next-auth/react'; // NEW: Check for admin login

export default function BookConferenceRoom() {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [todaysBookings, setTodaysBookings] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '', 
    teamName: '',
    reason: '',
    date: '',
    startTime: '',
    durationMinutes: 30
  });

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
      
      const approvedToday = data.filter((b: any) => {
        const bookingDate = b.date.split('T')[0];
        return b.status === 'APPROVED' && bookingDate === localISOTime;
      }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      
      setTodaysBookings(approvedToday);
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        const filtered = data.filter((emp: any) => 
          emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
        setShowDropdown(true);
      } catch (error) {}
      setIsSearching(false);
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const selectEmployee = (emp: any) => {
    setSearchQuery(`${emp.employeeCode} - ${emp.name}`);
    setFormData({ ...formData, employeeId: emp.id, teamName: emp.department || '' }); 
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Please select a valid employee from the dropdown.");
    
    setLoading(true);
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        status: isAdmin ? 'APPROVED' : 'PENDING' // Admin bookings auto-approve
      })
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    
    setFormData({ employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30 });
    setSearchQuery('');
    setIsCustomDuration(false);
    fetchSchedule(); 
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
    <div className="p-8 max-w-6xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Building className="text-blue-600" /> Book Conference Room
        </h1>
        <p className="text-neutral-500 mt-1">Check today's schedule and submit a request to reserve the main meeting room.</p>
        {isAdmin && <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Admin Mode: Your bookings are auto-approved</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm h-fit">
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
              {isAdmin ? 'Room booked successfully.' : 'Room booking requested successfully. An admin will review it shortly.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                {isSearching && <Loader2 className="absolute right-3 top-2.5 animate-spin text-neutral-400" size={18} />}
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

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Team / Department Name</label>
              <input type="text" required value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="e.g. Engineering Team" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Meeting Agenda</label>
              <input type="text" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="e.g. Q3 Sprint Planning" />
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
                  <select 
                    required 
                    value={formData.durationMinutes} 
                    onChange={e => {
                      if (e.target.value === 'custom') setIsCustomDuration(true);
                      else setFormData({...formData, durationMinutes: parseInt(e.target.value)});
                    }} 
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours</option>
                    <option value="custom">Custom...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="5" required 
                      value={formData.durationMinutes} 
                      onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})} 
                      className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none" 
                      placeholder="Minutes"
                    />
                    <button type="button" onClick={() => { setIsCustomDuration(false); setFormData({...formData, durationMinutes: 30}); }} className="text-xs text-neutral-500 hover:text-black">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors">
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isAdmin ? 'Book Room Instantly' : 'Submit Booking Request')}
            </button>
          </form>
        </div>

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
                <p className="text-sm">No meetings scheduled for today.<br/>The room is completely free.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysBookings.map((b) => (
                  <div key={b.id} className="relative pl-4 border-l-2 border-blue-500">
                    <div className="text-xs font-bold text-blue-600 mb-0.5">
                      {formatTimeRange(b.startTime, b.durationMinutes)}
                    </div>
                    <div className="font-bold text-neutral-900">{b.teamName}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-1">{b.reason}</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-mono uppercase">Hosted by: {b.employee?.name || 'Staff'}</div>
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