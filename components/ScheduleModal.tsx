'use client';
import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Loader2, Sparkles, Coffee, Link as LinkIcon, Filter, Building, Video } from 'lucide-react';
import { useSession } from 'next-auth/react'; // NEW: Used to identify the HR staff booking the room

export default function ScheduleModal({ isOpen, onClose, candidates, onSuccess }: any) {
  const { data: session } = useSession();
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

  // NEW: Location Settings
  const [locationType, setLocationType] = useState('VIRTUAL'); // 'VIRTUAL' or 'CONFERENCE_ROOM'
  const [meetingLink, setMeetingLink] = useState('');

  // Filters & State
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // NEW: HR Staff list for room booking fallback
  const [hrEmployees, setHrEmployees] = useState<any[]>([]);
  const [selectedHrId, setSelectedHrId] = useState('');

  useEffect(() => {
    if (isOpen) {
      const available = candidates.filter((c: any) => c.status === 'NEW' || c.status === 'RESCHEDULED');
      setScheduleData(available.map((c: any) => ({ ...c, selected: false, assignedTime: '' })));
      setDate(new Date().toISOString().split('T')[0]);
      setSelectAll(false);
      setPositionFilter('ALL');
      
      // Fetch employees to allow HR to book the room under their name if session is missing ID
      fetch('/api/employees')
        .then(res => res.json())
        .then(data => {
          const hrStaff = data.filter((emp: any) => emp.department.toLowerCase().includes('hr') || emp.department.toLowerCase().includes('human'));
          setHrEmployees(hrStaff.length > 0 ? hrStaff : data); 
        });
    }
  }, [isOpen, candidates]);

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
      // 1. Save ATS Interviews
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: payload })
      });

      if (!res.ok) throw new Error("Failed to save schedule");

      // 2. Book Conference Rooms if necessary
      if (locationType === 'CONFERENCE_ROOM') {
        const bookerId = (session?.user as any)?.employeeId || selectedHrId;
        
        // Push each interview as an auto-approved room booking
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

            {/* NEW: Location Settings */}
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
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                  <p className="text-xs text-emerald-800 font-medium mb-2">This will automatically sync and book the conference room schedule for all assigned time slots.</p>
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
                        <div className="text-xs text-neutral-500">{c.position}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input type="time" value={c.assignedTime} onChange={(e) => handleManualTimeChange(c.id, e.target.value)} className={`px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-colors ${c.assignedTime ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-neutral-200 text-neutral-500'}`} />
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