'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Check, X, DoorOpen, Loader2, Users, Plus, Search, Calendar } from 'lucide-react';

export default function AdminConferenceDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Autocomplete State for Employees
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Booking Form State
  const [formData, setFormData] = useState({
    roomId: '',
    roomName: '',
    employeeId: '',
    teamName: '',
    reason: '',
    date: '',
    startTime: '',
    durationMinutes: 30
  });

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/rooms')
      ]);
      
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      console.error("Failed to load conference data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchData]);

  // Employee Autocomplete Search
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
          emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
    setFormData(prev => ({ ...prev, employeeId: emp.id, teamName: emp.department || '' }));
    setShowDropdown(false);
  };

  const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = rooms.find(r => r.id === e.target.value);
    setFormData(prev => ({
      ...prev,
      roomId: selected?.id || '',
      roomName: selected?.name || ''
    }));
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Please select a valid employee.");
    if (!formData.roomName) return alert("Please select a conference room.");

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'APPROVED' // Admin bookings auto-approve
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Room booked successfully!');
        fetchData();
        setTimeout(() => {
          setSuccessMessage('');
          setIsModalOpen(false);
          setFormData({ roomId: '', roomName: '', employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30 });
          setSearchQuery('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to book room.');
      }
    } catch (error) {
      alert("An error occurred while booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, newStatus: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    try {
      await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      alert("Failed to update status.");
      fetchData();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 pb-24">
      
      {/* Header with Book Room Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" /> Conference Bookings
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review, approve, and schedule workspace reservations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Plus size={16} /> Book Room
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="animate-spin text-neutral-400 w-8 h-8" />
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Requester & Team</th>
                <th className="px-6 py-4">Workspace & Agenda</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-neutral-400">No conference room bookings found.</td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{booking.employee?.name || 'Staff Member'}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1">
                        <Users size={12} className="text-neutral-400" /> {booking.teamName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-indigo-500" /> {booking.roomName}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 line-clamp-1">{booking.reason}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-neutral-400"/> {booking.startTime} ({booking.durationMinutes}m)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        booking.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' : 
                        booking.status === 'CONFLICT' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {booking.status === 'PENDING' || booking.status === 'CONFLICT' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAction(booking.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 font-bold text-xs transition-colors" title="Approve">
                            <Check size={14} /> Approve
                          </button>
                          <button onClick={() => handleAction(booking.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 font-bold text-xs transition-colors" title="Reject">
                            <X size={14} /> Deny
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleAction(booking.id, 'PENDING')} className="text-xs text-neutral-400 hover:text-neutral-700 underline font-medium">
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Book Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar className="text-blue-600" /> Book Conference Room
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">Schedule a meeting space instantly as Admin.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>

            {successMessage ? (
              <div className="py-12 text-center space-y-3">
                <Check size={48} className="text-emerald-500 mx-auto bg-emerald-50 p-2.5 rounded-full" />
                <h3 className="text-lg font-bold text-neutral-900">{successMessage}</h3>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                {/* Room Selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Select Workspace *</label>
                  <select required value={formData.roomId} onChange={handleRoomSelect} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-white">
                    <option value="">-- Choose a Room --</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name} (Capacity: {room.capacity})</option>
                    ))}
                  </select>
                </div>

                {/* Employee Autocomplete */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Host Employee *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    <input 
                      type="text" value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setFormData({ ...formData, employeeId: '' }); }}
                      placeholder="Type employee ID or name..." 
                      className="w-full pl-10 p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-neutral-50 focus:bg-white transition-colors" required
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-2.5 animate-spin text-neutral-400" size={18} />}
                  </div>
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
                      {suggestions.map((emp) => (
                        <li key={emp.id} onClick={() => selectEmployee(emp)} className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0">
                          <div className="font-bold text-neutral-900">{emp.name}</div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode} • {emp.department}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Team / Department *</label>
                    <input type="text" required value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Engineering" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Agenda / Reason *</label>
                    <input type="text" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Sprint Planning" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Date *</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Start Time *</label>
                    <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Duration *</label>
                    <select required value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-white">
                      <option value={15}>15 Mins</option>
                      <option value={30}>30 Mins</option>
                      <option value={45}>45 Mins</option>
                      <option value={60}>1 Hour</option>
                      <option value={90}>1.5 Hours</option>
                      <option value={120}>2 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-neutral-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors">
                    {submitting && <Loader2 size={16} className="animate-spin" />} Book Instantly
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}