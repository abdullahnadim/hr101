'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Check, X, DoorOpen, 
  Loader2, Users, Plus, Search, Building, Trash2, Edit
} from 'lucide-react';

export default function AdminConferenceDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(''); 
  
  // Modals State
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unified Form State (Used for both New Bookings & Reviewing/Editing existing ones)
  const [formData, setFormData] = useState({
    id: '', // Used only during review/edit
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
      
      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        // Sort pending first, then by date/time
        const sorted = (Array.isArray(bData) ? bData : []).sort((a: any, b: any) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
          return a.startTime.localeCompare(b.startTime);
        });
        setBookings(sorted);
      }
      
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        setRooms((Array.isArray(rData) ? rData : []).filter(r => r.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error("Failed to load conference data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setDateFilter(new Date().toISOString().split('T')[0]); // Default to today
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchData]);

  // --- EMPLOYEE AUTOCOMPLETE ---
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
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter((emp: any) => 
            emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            emp.name?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSuggestions(filtered.slice(0, 5));
          setShowDropdown(true);
        }
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

  // --- ACTIONS ---
  const handleAction = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel and delete this booking permanently?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      alert('Failed to delete booking.');
    }
  };

  const openReviewModal = (booking: any) => {
    setFormData({
      id: booking.id,
      roomId: booking.roomId || '',
      roomName: booking.roomName || '',
      employeeId: booking.employeeId,
      teamName: booking.teamName || '',
      reason: booking.reason || '',
      date: booking.date ? booking.date.split('T')[0] : '',
      startTime: booking.startTime || '',
      durationMinutes: booking.durationMinutes || 30
    });
    setSearchQuery(booking.employee?.name || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, status: 'APPROVED' }; // Auto approve on HR save
      
      const res = await fetch(`/api/bookings/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage('Booking updated and approved successfully!');
        fetchData();
        setTimeout(() => {
          setSuccessMessage('');
          setIsReviewModalOpen(false);
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update booking.');
      }
    } catch (error) {
      alert("An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
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
        body: JSON.stringify({ ...formData, status: 'APPROVED' })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Room booked successfully!');
        fetchData();
        setTimeout(() => {
          setSuccessMessage('');
          setIsNewBookingModalOpen(false);
          setFormData({ id: '', roomId: '', roomName: '', employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30 });
          setSearchQuery('');
        }, 1500);
      } else {
        alert(data.error || data.message || 'Failed to book room.');
      }
    } catch (error) {
      alert("An error occurred while booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- FORMATTERS & FILTERS ---
  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    if (!startTime) return 'TBD';
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const format = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${format(start)} – ${format(end)}`;
  };

  const filteredBookings = bookings.filter(b => {
    if (!dateFilter) return true;
    return b.date && b.date.startsWith(dateFilter);
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Building className="text-blue-600" /> HR Conference Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review requests, assign alternate rooms, and manage schedules.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <CalendarIcon size={16} className="text-neutral-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-neutral-900 outline-none font-medium"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-[10px] uppercase font-bold text-blue-600 hover:underline ml-1">Clear</button>
            )}
          </div>
          
          <button 
            onClick={() => {
              setFormData({ id: '', roomId: '', roomName: '', employeeId: '', teamName: '', reason: '', date: '', startTime: '', durationMinutes: 30 });
              setSearchQuery('');
              setIsNewBookingModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
          >
            <Plus size={16} /> Book on Behalf
          </button>
        </div>
      </header>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="animate-spin text-neutral-400 w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 font-bold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4">Requester & Team</th>
                  <th className="px-6 py-4">Workspace & Agenda</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <DoorOpen size={40} className="mx-auto text-neutral-200 mb-3" />
                      <p className="text-neutral-500 font-medium">No bookings found for this date.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking.id} className={`transition-colors group ${booking.status === 'PENDING' || booking.status === 'CONFLICT' ? 'bg-amber-50/30' : 'hover:bg-neutral-50/80'}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{booking.employee?.name || 'Staff Member'}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 flex items-center gap-1 mt-1">
                          <Users size={12} className="text-neutral-400" /> {booking.teamName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-700 flex items-center gap-1.5">
                          <DoorOpen size={14} /> {booking.roomName}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1 line-clamp-1">{booking.reason}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}</div>
                        <div className="text-xs font-bold text-neutral-500 flex items-center gap-1 mt-1">
                          <Clock size={12} className="text-neutral-400"/> {formatTimeRange(booking.startTime, booking.durationMinutes)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          booking.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
                          booking.status === 'CONFLICT' ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' :
                          'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          
                          {/* HR Editing / Reassigning (Always available unless rejected) */}
                          {booking.status !== 'REJECTED' && (
                            <button onClick={() => openReviewModal(booking)} className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 font-bold text-xs transition-colors shadow-sm" title="Reassign Room/Time">
                              <Edit size={14} /> Review & Assign
                            </button>
                          )}
                          
                          {/* Quick Approve/Deny for Pending/Conflicts */}
                          {(booking.status === 'PENDING' || booking.status === 'CONFLICT') && (
                            <>
                              <button onClick={() => handleAction(booking.id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors shadow-sm" title="Quick Approve">
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleAction(booking.id, 'REJECTED')} className="p-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors shadow-sm" title="Reject">
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {/* Delete */}
                          <button onClick={() => handleDelete(booking.id)} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:border-red-200 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all ml-2" title="Delete Permanent">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- UNIFIED MODAL (Creates New OR Edits/Reassigns Existing) --- */}
      {(isNewBookingModalOpen || isReviewModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden border border-neutral-100">
            
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarIcon className="text-blue-600" /> 
                  {isReviewModalOpen ? 'Review & Assign Booking' : 'Book on Behalf'}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {isReviewModalOpen ? 'Modify the room, date, or time frame to clear conflicts.' : 'Schedule a meeting space directly as an administrator.'}
                </p>
              </div>
              <button onClick={() => { setIsNewBookingModalOpen(false); setIsReviewModalOpen(false); }} className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>
            </div>

            {successMessage ? (
              <div className="py-12 text-center space-y-3">
                <Check size={48} className="text-emerald-500 mx-auto bg-emerald-50 p-2.5 rounded-full" />
                <h3 className="text-lg font-bold text-neutral-900">{successMessage}</h3>
              </div>
            ) : (
              <form onSubmit={isReviewModalOpen ? handleSaveReview : handleCreateBooking} className="space-y-4">
                
                {/* Room Selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5 flex items-center gap-1.5"><DoorOpen size={14}/> Assign Workspace *</label>
                  <select required value={formData.roomId} onChange={handleRoomSelect} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-white font-medium">
                    <option value="">-- Choose a Room --</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name} (Cap: {room.capacity})</option>
                    ))}
                  </select>
                </div>

                {/* Employee Autocomplete (Disabled during review so HR doesn't accidentally change the requester) */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5 flex items-center gap-1.5"><Users size={14}/> Host / Requester *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                    <input 
                      type="text" value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setFormData({ ...formData, employeeId: '' }); }}
                      placeholder="Type employee ID or name..." 
                      className={`w-full pl-9 p-2.5 border border-neutral-300 rounded-lg outline-none text-sm transition-colors ${isReviewModalOpen ? 'bg-neutral-100 cursor-not-allowed text-neutral-500' : 'bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black'}`} 
                      required
                      disabled={isReviewModalOpen}
                    />
                    {isSearching && !isReviewModalOpen && <Loader2 className="absolute right-3 top-2.5 animate-spin text-neutral-400" size={16} />}
                  </div>
                  {showDropdown && !isReviewModalOpen && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
                      {suggestions.map((emp) => (
                        <li key={emp.id} onClick={() => selectEmployee(emp)} className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0">
                          <div className="font-bold text-neutral-900 text-sm">{emp.name}</div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode} - {emp.department}</div>
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
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Start Time *</label>
                    <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Duration *</label>
                    <select required value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-white font-medium">
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
                  <button type="button" onClick={() => { setIsNewBookingModalOpen(false); setIsReviewModalOpen(false); }} className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors active:scale-95">
                    {submitting && <Loader2 size={16} className="animate-spin" />} 
                    {isReviewModalOpen ? 'Save & Approve' : 'Book Instantly'}
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