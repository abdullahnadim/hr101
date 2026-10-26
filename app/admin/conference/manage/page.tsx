'use client';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Trash2, CheckCircle, XCircle, Search, Building } from 'lucide-react';

export default function ConferenceAdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(''); // Default to all or today

  const fetchBookings = () => {
    setIsLoading(true);
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        // Sort bookings by date and time
        const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
          if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
          return a.startTime.localeCompare(b.startTime);
        });
        setBookings(sorted);
        setIsLoading(false);
      })
      .catch(() => {
        setBookings([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // Set default filter to today's date
    setDateFilter(new Date().toISOString().split('T')[0]);
    fetchBookings();
  }, []);

  // --- FORMATTERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeString: string, includeTz: boolean = false) => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}${includeTz ? ' (Bangladesh Time)' : ''}`;
  };

  // --- ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and delete this room booking? This will immediately free up the slot.')) return;
    
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBookings();
      } else {
        alert('Failed to delete booking.');
      }
    } catch (e) {
      alert('Error connecting to the server.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  // --- FILTER LOGIC ---
  const filteredBookings = bookings.filter(b => {
    if (!dateFilter) return true; // Show all if no date selected
    return b.date && b.date.startsWith(dateFilter);
  });

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <Building size={20} className="text-neutral-500" />
            Conference Room Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage physical room availability, approve requests, and clear conflicts.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <CalendarIcon size={16} className="text-neutral-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-neutral-900 outline-none"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-blue-600 font-medium hover:underline ml-2">
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto flex-1 w-full space-y-6">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          
          {isLoading ? (
            <div className="text-center py-20 text-neutral-400 text-sm">Loading bookings...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Reserved By</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                            <Clock size={14} className="text-neutral-400" />
                            {formatTime(booking.startTime)} - {booking.durationMinutes}m
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">{formatDate(booking.date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900 flex items-center gap-1.5">
                            <Users size={14} className="text-neutral-400" />
                            {booking.teamName || 'Unknown Team'}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {booking.employee?.name || 'ATS Automated'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-neutral-700">{booking.reason || 'No specific reason provided'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                            booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {booking.status === 'APPROVED' && <CheckCircle size={12} />}
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* Status Toggles (Only show if pending) */}
                            {booking.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleUpdateStatus(booking.id, 'APPROVED')} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm" title="Approve Request">
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => handleUpdateStatus(booking.id, 'REJECTED')} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-amber-50 hover:text-amber-600 transition-all shadow-sm" title="Reject Request">
                                  <XCircle size={14} />
                                </button>
                                <div className="w-px h-5 bg-neutral-200 mx-1"></div>
                              </>
                            )}

                            {/* Permanent Delete/Cancel */}
                            <button 
                              onClick={() => handleDelete(booking.id)} 
                              className="p-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm" 
                              title="Cancel & Free Room Slot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-400">
                        {dateFilter ? `No room bookings scheduled for ${formatDate(dateFilter)}.` : 'No room bookings found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}