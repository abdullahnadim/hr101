'use client';
import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Loader2, Sparkles, Coffee, Link as LinkIcon, Filter, Building, Video } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSettingsStore } from '@/store/useSettingsStore'; 

export default function ScheduleModal({ isOpen, onClose, candidates, onSuccess }: any) {
  const { data: session } = useSession();
  const { whatsappTemplate } = useSettingsStore(); 
  const [loading, setLoading] = useState(false);
  
  // Settings
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00'); 
  const [duration, setDuration] = useState('30');
  const [interval, setInterval] = useState('5');
  
  // Break Settings
  const [breakStart, setBreakStart] = useState('');
  const [breakDuration, setBreakDuration] = useState('60');

  // Location Settings
  const [locationType, setLocationType] = useState('VIRTUAL'); 
  const [meetingLink, setMeetingLink] = useState('');
  
  // Room Timeline State
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Filters & State
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // HR Staff list for room booking fallback
  const [hrEmployees, setHrEmployees] = useState<any[]>([]);
  const [selectedHrId, setSelectedHrId] = useState('');

  // Fetch HR Staff & Initialize Candidates
  useEffect(() => {
    if (isOpen) {
      // FIX: Include 'SCHEDULED' candidates so they can be Rescheduled. 
      // Do not allow hired or rejected candidates to be scheduled.
      const available = candidates.filter((c: any) => 
        c.status === 'NEW' || 
        c.status === 'RESCHEDULED' || 
        c.status === 'SCHEDULED' || 
        c.status === 'INTERVIEWED'
      );
      
      setScheduleData(available.map((c: any) => ({ ...c, selected: false, assignedTime: '' })));
      setDate(new Date().toISOString().split('T')[0]);
      setSelectAll(false);
      setPositionFilter('ALL');
      
      fetch('/api/employees')
        .then(res => res.json())
        .then(data => {
          const hrStaff = data.filter((emp: any) => emp.department.toLowerCase().includes('hr') || emp.department.toLowerCase().includes('human'));
          setHrEmployees(hrStaff.length > 0 ? hrStaff : data); 
        });
    }
  }, [isOpen, candidates]);

  // Fetch Live Room Timeline
  useEffect(() => {
    if (locationType === 'CONFERENCE_ROOM' && date) {
      setLoadingTimeline(true);
      fetch('/api/bookings')
        .then(res => res.json())
        .then(data => {
          const filtered = data.filter((b: any) => {
            const bookingDate = b.date.split('T')[0];
            return b.status === 'APPROVED' && bookingDate === date;
          }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
          
          setDayBookings(filtered);
          setLoadingTimeline(false);
        })
        .catch(() => setLoadingTimeline(false));
    }
  }, [locationType, date]);

  // --- FORMATTERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm} (Bangladesh Time)`;
  };

  if (!isOpen) return null;

  const uniquePositions = Array.from(new Set(scheduleData.map(c => c.position)));
  const filteredCandidates = scheduleData.filter(c => positionFilter === 'ALL' || c.position === positionFilter);
  const selectedCount = scheduleData.filter(c => c.selected).length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setScheduleData(prev => prev.map(c => {
      if (positionFilter === 'ALL' || c.position === positionFilter) {
        return { ...c, selected: checked };
      }
      return c;
    }));
  };

  const toggleCandidate = (id: string) => {
    setScheduleData(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleManualTimeChange = (id: string, time: string) => {
    setScheduleData(prev => prev.map(c => c.id === id ? { ...c, assignedTime: time, selected: true } : c));
  };

  // --- WHATSAPP INVITE HELPER ---
  const handleWhatsAppInvite = (candidate: any) => {
    if (!candidate.assignedTime || !date) {
      alert("Please assign a date and time slot first.");
      return;
    }
    
    let phone = candidate.phone ? candidate.phone.replace(/\D/g, '') : '';
    if (!phone) {
      alert("This candidate does not have a valid phone number on file.");
      return;
    }

    if (phone.startsWith('01') && phone.length === 11) {
      phone = `88${phone}`;
    }

    const formattedDate = formatDate(date);
    const formattedTime = formatTime(candidate.assignedTime);

    const message = (whatsappTemplate || `Hi {{candidate_name}}, your interview for {{position}} is on {{interview_date}} at {{interview_time}}. Please confirm.`)
      .replace(/\{\{candidate_name\}\}/g, candidate.name || '')
      .replace(/\{\{position\}\}/g, candidate.position || '')
      .replace(/\{\{interview_date\}\}/g, formattedDate)
      .replace(/\{\{interview_time\}\}/g, formattedTime)
      .replace(/\{\{interview_duration\}\}/g, duration);

    const locationText = locationType === 'VIRTUAL' 
      ? `\n📍 Location: Online via Google Meet: ${meetingLink || 'Link will be shared soon'}` 
      : `\n📍 Location: In-Person at our Office Conference Room`;

    const finalMessage = message + locationText;
    const encodedMessage = encodeURIComponent(finalMessage);
    
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleAutoFill = () => {
    if (!startTime || !endTime) return alert('Please enter valid Start and End times.');

    const [startHr, startMin] = startTime.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(startHr, startMin, 0, 0);

    const [endHr, endMin] = endTime.split(':').map(Number);
    let dayEnd = new Date(currentTime);
    dayEnd.setHours(endHr, endMin, 0, 0);

    if (dayEnd <= currentTime) {
      dayEnd.setDate(dayEnd.getDate() + 1);
    }

    let bStart: Date | null = null;
    let bEnd: Date | null = null;
    if (breakStart && breakDuration) {
      const [bHr, bMin] = breakStart.split(':').map(Number);
      bStart = new Date(currentTime);
      bStart.setHours(bHr, bMin, 0, 0);
      const bDur = parseInt(breakDuration) || 0;
      bEnd = new Date(bStart.getTime() + (bDur * 60000));
    }

    const dur = parseInt(duration) || 30;
    const intv = parseInt(interval) || 0;

    let outOfTime = false;
    let scheduledCount = 0;
    let overflowCount = 0;

    const newScheduleData = scheduleData.map(c => {
      if (!c.selected) return c; 
      if (outOfTime) { overflowCount++; return c; }

      if (bStart && bEnd) {
        const proposedEnd = new Date(currentTime.getTime() + (dur * 60000));
        if (currentTime >= bStart && currentTime < bEnd) {
          currentTime = new Date(bEnd); 
        } else if (currentTime < bStart && proposedEnd > bStart) {
          currentTime = new Date(bEnd); 
        }
      }

      const finalProposedEnd = new Date(currentTime.getTime() + (dur * 60000));
      if (finalProposedEnd > dayEnd) {
        outOfTime = true;
        overflowCount++;
        return c; 
      }

      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      currentTime = new Date(currentTime.getTime() + ((dur + intv) * 60000));
      scheduledCount++;

      return { ...c, assignedTime: timeString };
    });

    if (outOfTime) {
      const confirmSpill = window.confirm(
        `Today's schedule is full! Fit ${scheduledCount} candidates before end time (${endTime}).\n\nDeselect the remaining ${overflowCount} candidates?`
      );
      if (confirmSpill) {
        const finalData = newScheduleData.map(c => {
          if (c.selected && !c.assignedTime) return { ...c, selected: false };
          return c;
        });
        setScheduleData(finalData);
        return;
      }
    }
    setScheduleData(newScheduleData);
  };

  const handleSubmit = async () => {
    const toSchedule = scheduleData.filter(c => c.selected && c.assignedTime);
    
    if (toSchedule.length === 0) return alert("Please assign a time to at least one selected candidate.");
    if (!date) return alert("Please select an interview date.");
    if (locationType === 'CONFERENCE_ROOM' && !selectedHrId && !(session?.user as any)?.employeeId) {
      return alert("Please select an HR representative to book the conference room under.");
    }

    setLoading(true);

    const payload = toSchedule.map(c => ({
      candidateId: c.id,
      date: date,
      startTime: c.assignedTime,
      durationMinutes: duration,
      type: locationType === 'VIRTUAL' ? 'ONLINE' : 'IN_PERSON',
      location: locationType === 'VIRTUAL' ? meetingLink : 'Conference Room' 
    }));

    try {
      // 1. Save ATS Interviews (This backend route handles updating Candidate status to SCHEDULED/RESCHEDULED)
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: payload })
      });

      if (!res.ok) throw new Error("Failed to save schedule");

      // 2. Book Conference Rooms if necessary
      if (locationType === 'CONFERENCE_ROOM') {
        const bookerId = (session?.user as any)?.employeeId || selectedHrId;
        
        for (const schedule of payload) {
          const roomRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: bookerId,
              teamName: 'Recruitment (ATS)',
              reason: `Interview slot for candidates`,
              date: schedule.date,
              startTime: schedule.startTime,
              durationMinutes: schedule.durationMinutes,
              status: 'APPROVED'
            })
          });
          
          const roomData = await roomRes.json();
          if (roomData.message && roomData.message.includes('conflict')) {
            alert(`Warning: Time conflict detected for ${schedule.startTime} in the Conference Room. Check Room Admin dashboard.`);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert("Error: Failed to process schedule.");
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="font-semibold text-lg text-neutral-900">Schedule Interviews</h2>
            <p className="text-xs text-neutral-500 mt-1">Auto-generate with breaks or manually assign time slots.</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Left Column: Settings */}
          <div className="w-full md:w-80 bg-neutral-50 border-r border-neutral-100 p-6 space-y-6 overflow-y-auto">
            
            {/* Timing */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Session Details</h3>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Interview Date</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-2.5 text-neutral-400" />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Duration</label>
                  <div className="relative">
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                    <span className="absolute right-3 top-2.5 text-xs text-neutral-400">m</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Buffer</label>
                  <div className="relative">
                    <input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                    <span className="absolute right-3 top-2.5 text-xs text-neutral-400">m</span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-neutral-200" />

            {/* Breaks */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5"><Coffee size={14} /> Scheduled Break</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Break Start</label>
                  <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Duration (m)</label>
                  <input type="number" value={breakDuration} onChange={(e) => setBreakDuration(e.target.value)} placeholder="60" className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
              </div>
            </div>

            <hr className="border-neutral-200" />

            {/* Location Settings */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Interview Location</h3>
              
              <div className="grid grid-cols-2 gap-2 bg-neutral-200/50 p-1 rounded-lg">
                <button 
                  onClick={() => setLocationType('VIRTUAL')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-colors ${locationType === 'VIRTUAL' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
                >
                  <Video size={14} /> Virtual
                </button>
                <button 
                  onClick={() => setLocationType('CONFERENCE_ROOM')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-colors ${locationType === 'CONFERENCE_ROOM' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
                >
                  <Building size={14} /> Room Book
                </button>
              </div>

              {locationType === 'VIRTUAL' ? (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5"><LinkIcon size={12} className="inline mr-1"/> Meet/Zoom Link</label>
                  <input type="text" placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg space-y-3">
                  <p className="text-xs text-emerald-800 font-medium">This will automatically sync and book the conference room schedule for all assigned time slots.</p>
                  
                  {!(session?.user as any)?.employeeId && (
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Book room under:</label>
                      <select value={selectedHrId} onChange={(e) => setSelectedHrId(e.target.value)} className="w-full text-xs p-1.5 border border-emerald-200 rounded bg-white focus:ring-2 focus:ring-emerald-500">
                        <option value="">Select HR Representative...</option>
                        {hrEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Live Timeline Display */}
                  <div className="bg-white border border-emerald-200 p-2 rounded text-xs">
                    <div className="flex justify-between items-center font-bold text-emerald-800 mb-2 border-b border-emerald-100 pb-1">
                      <span>Room Timeline ({date ? formatDate(date) : ''})</span>
                      {loadingTimeline && <Loader2 size={10} className="animate-spin" />}
                    </div>
                    {dayBookings.length === 0 ? (
                      <p className="text-[10px] text-neutral-500 italic">No bookings yet. Room is free.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {dayBookings.map((b) => (
                          <div key={b.id} className="text-[10px] bg-red-50 border border-red-100 text-red-700 px-1.5 py-0.5 rounded flex justify-between items-center font-medium">
                            <span>{formatTime(b.startTime)} ({b.durationMinutes}m)</span>
                            <span className="truncate max-w-[80px] text-neutral-500 ml-2">{b.teamName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
            
            <div className="pt-2">
              <button onClick={handleAutoFill} disabled={selectedCount === 0} className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                <Sparkles size={16} /> Auto-Fill Selected
              </button>
            </div>
          </div>

          {/* Right Column: Candidate List */}
          <div className="flex-1 p-6 flex flex-col bg-white overflow-hidden">
            
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black" />
                Select All
              </label>
              
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-neutral-500" />
                <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="text-sm bg-transparent border-none font-medium text-neutral-700 focus:ring-0 cursor-pointer outline-none">
                  <option value="ALL">All Positions</option>
                  {uniquePositions.map((pos: any) => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-sm">No candidates match this filter.</div>
              ) : (
                filteredCandidates.map((c) => (
                  <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${c.selected ? 'border-neutral-300 bg-white shadow-sm ring-1 ring-black/5' : 'border-neutral-100 hover:border-neutral-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={c.selected} onChange={() => toggleCandidate(c.id)} className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{c.name}</div>
                        <div className="text-xs text-neutral-500 flex items-center gap-2">
                           {c.position}
                           {c.status === 'SCHEDULED' && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded uppercase">Already Scheduled</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input type="time" value={c.assignedTime} onChange={(e) => handleManualTimeChange(c.id, e.target.value)} className={`px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-colors ${c.assignedTime ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-neutral-200 text-neutral-500'}`} />
                      
                      {/* WhatsApp Click-to-Chat Button */}
                      {c.assignedTime && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppInvite(c)}
                          title="Send WhatsApp Invite"
                          className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-600 bg-white px-3 py-1 rounded-md border border-neutral-200">
            {selectedCount} selected for scheduling
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-sm transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || selectedCount === 0 || !scheduleData.some(c => c.selected && c.assignedTime)} className="px-6 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving & Booking Room...' : 'Save Schedule'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}