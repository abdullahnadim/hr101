'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, Users, Building, Search, Loader2, DoorOpen, CheckCircle, CalendarRange, Info } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function BookConferenceRoom() {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Schedule state for the selected room and date
  const [roomSchedule, setRoomSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    date: new Date().toISOString().split('T')[0], // default today
    startTime: '09:00',
    durationMinutes: 30
  });

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        const activeRooms = data.filter((r: any) => r.status === 'ACTIVE');
        setRooms(activeRooms);
        if (activeRooms.length > 0 && !selectedRoom) {
          setSelectedRoom(activeRooms[0]); // Select first room by default
        }
      }
    } catch (error) {
      console.error("Failed to load rooms", error);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedRoom]);

  // Fetch schedule for the currently selected room and date
  const fetchRoomSchedule = useCallback(async () => {
    if (!selectedRoom) return;
    setLoadingSchedule(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((b: any) => {
          const bookingDate = b.date.split('T')[0];
          return (
            b.status === 'APPROVED' && 
            bookingDate === formData.date && 
            (b.roomId === selectedRoom.id || b.roomName === selectedRoom.name)
          );
        }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

        setRoomSchedule(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedRoom, formData.date]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchRoomSchedule();
  }, [selectedRoom, formData.date, fetchRoomSchedule]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Employee Autocomplete
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
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert("Please select a valid employee from the dropdown.");
    if (!selectedRoom) return alert("Please select a room.");
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          status: isAdmin ? 'APPROVED' : 'PENDING'
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        fetchRoomSchedule();
        setTimeout(() => setSuccess(false), 4000);
        setFormData(prev => ({ ...prev, reason: '', startTime: '09:00' }));
        setSearchQuery(''); // Reset search
      } else {
        alert(data.message || data.error || 'Failed to process booking.');
      }
    } catch (error) {
      alert("An network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const format = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${format(start)} – ${format(end)}`;
  };

  if (loadingRooms) return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><Loader2 className="animate-spin text-neutral-400 w-8 h-8" /></div>;

  let amenities = [];
  try { 
    amenities = typeof selectedRoom?.amenities === 'string' ? JSON.parse(selectedRoom.amenities) : selectedRoom?.amenities || []; 
  } catch { amenities = []; }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6 md:p-12 pb-24 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Conference Room Booking</h1>
          <p className="text-neutral-500 max-w-lg mx-auto text-sm">Select a workspace to check live availability, view daily schedules, and submit your reservation.</p>
          {isAdmin && <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 shadow-sm">Admin Mode: Active bookings auto-approve</span>}
        </div>

        {/* 1. Room Selection Tabs / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map(room => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={`p-5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-black text-white border-black shadow-lg scale-[1.02]' 
                    : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <DoorOpen size={20} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isSelected ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'}`}>
                      {room.capacity} Seats
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-snug">{room.name}</h3>
                </div>
                <div className={`text-xs mt-4 font-medium flex items-center gap-1 ${isSelected ? 'text-neutral-300' : 'text-blue-600'}`}>
                  {isSelected ? 'Viewing Schedule & Form →' : 'Select Room'}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Selected Room Dashboard (Schedule + Booking Form) */}
        {selectedRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
            
            {/* Left 2 Cols: Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Building className="text-blue-600" /> Book {selectedRoom.name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Users size={12}/> Max Capacity: {selectedRoom.capacity}
                  </span>
                  {amenities.map((a: string, i: number) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {success && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium flex items-center gap-3">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  <div>
                    <p className="font-bold">Request Submitted!</p>
                    <p className="text-xs mt-0.5">Your booking for {selectedRoom.name} has been {isAdmin ? 'approved' : 'forwarded to Admin for review'}.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Employee Autocomplete */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Requester (Employee ID or Name) *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-neutral-400" size={16} />
                    <input 
                      type="text" value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setFormData({ ...formData, employeeId: '' }); }}
                      placeholder="Search your ID or Name..." 
                      className="w-full pl-9 p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-neutral-50 focus:bg-white transition-colors" required
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-3 animate-spin text-neutral-400" size={16} />}
                  </div>
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
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
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Meeting Agenda / Reason *</label>
                    <input type="text" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Sprint Review" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Date *</label>
                    <input 
                      type="date" required 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Start Time *</label>
                    <input 
                      type="time" required 
                      value={formData.startTime} 
                      onChange={e => setFormData({...formData, startTime: e.target.value})} 
                      className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Duration *</label>
                    {!isCustomDuration ? (
                      <select required value={formData.durationMinutes} onChange={e => {
                        if (e.target.value === 'custom') setIsCustomDuration(true);
                        else setFormData({...formData, durationMinutes: parseInt(e.target.value)});
                      }} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm bg-white">
                        <option value={15}>15 Mins</option>
                        <option value={30}>30 Mins</option>
                        <option value={45}>45 Mins</option>
                        <option value={60}>1 Hour</option>
                        <option value={90}>1.5 Hours</option>
                        <option value={120}>2 Hours</option>
                        <option value="custom">Custom...</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input type="number" min="5" required value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})} className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Mins" />
                        <button type="button" onClick={() => { setIsCustomDuration(false); setFormData({...formData, durationMinutes: 30}); }} className="text-xs text-neutral-500 hover:text-black">X</button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full mt-2 bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors text-sm shadow-md active:scale-95">
                  {submitting && <Loader2 className="animate-spin" size={16} />} {isAdmin ? 'Book Room Instantly' : 'Submit Booking Request'}
                </button>
              </form>
            </div>

            {/* Right Col: Live Schedule for Selected Room & Date */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                  <CalendarRange size={16} className="text-blue-600" /> Schedule for {new Date(formData.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px]">
                {loadingSchedule ? (
                  <div className="flex justify-center items-center h-full py-12"><Loader2 className="animate-spin text-neutral-400" size={24} /></div>
                ) : roomSchedule.length === 0 ? (
                  <div className="text-center text-neutral-500 py-12 flex flex-col items-center gap-2">
                    <Info size={24} className="text-neutral-300" />
                    <p className="text-xs font-medium">No bookings for this room on {formData.date}.<br/>The room is completely free!</p>
                  </div>
                ) : (
                  roomSchedule.map((b) => (
                    <div key={b.id} className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm space-y-1 hover:border-blue-300 transition-colors">
                      <div className="text-xs font-bold text-blue-600">
                        {formatTimeRange(b.startTime, b.durationMinutes)}
                      </div>
                      <div className="font-bold text-neutral-900 text-sm">{b.teamName}</div>
                      <p className="text-xs text-neutral-500 line-clamp-1">{b.reason}</p>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase mt-1">Host: {b.employee?.name || 'Staff'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}