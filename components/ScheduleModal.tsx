'use client';
import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Loader2, Sparkles, Coffee, Link as LinkIcon, Filter } from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, candidates, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  
  // Settings
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [interval, setInterval] = useState('5');
  
  // Break Settings
  const [breakStart, setBreakStart] = useState('');
  const [breakDuration, setBreakDuration] = useState('60');

  // Meet Link
  const [meetingLink, setMeetingLink] = useState('');

  // Filters & State
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const available = candidates.filter((c: any) => c.status === 'NEW' || c.status === 'RESCHEDULED');
      setScheduleData(available.map((c: any) => ({ ...c, selected: false, assignedTime: '' })));
      setDate(new Date().toISOString().split('T')[0]);
      setSelectAll(false);
      setPositionFilter('ALL');
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

  // Upgraded Auto-Fill Algorithm (Native JS Math - No more timezone/date-fns bugs)
  const handleAutoFill = () => {
    if (!startTime) return alert('Please enter a valid Start Time.');

    // Parse base start time directly from the string (e.g. "09:00")
    const [startHr, startMin] = startTime.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(startHr, startMin, 0, 0);

    // Parse break time if provided
    let bStart: Date | null = null;
    if (breakStart) {
      const [bHr, bMin] = breakStart.split(':').map(Number);
      bStart = new Date();
      bStart.setHours(bHr, bMin, 0, 0);
    }

    const bDuration = parseInt(breakDuration) || 0;
    const dur = parseInt(duration) || 30;
    const intv = parseInt(interval) || 0;

    setScheduleData(prev => {
      return prev.map(c => {
        if (!c.selected) return c; 

        // Check break collisions
        if (bStart) {
          const proposedEnd = new Date(currentTime.getTime() + (dur * 60000));
          const bEnd = new Date(bStart.getTime() + (bDuration * 60000));

          if (currentTime >= bStart && currentTime < bEnd) {
            currentTime = bEnd; // Shift to end of break
          } else if (currentTime < bStart && proposedEnd > bStart) {
            currentTime = bEnd; // Overlaps, shift to end of break
          }
        }

        // Extract HH:MM in 24hr format for the HTML time input
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        // Add duration + buffer to setup the next loop
        currentTime = new Date(currentTime.getTime() + ((dur + intv) * 60000));

        return { ...c, assignedTime: timeString };
      });
    });
  };

  const handleSubmit = async () => {
    const toSchedule = scheduleData.filter(c => c.selected && c.assignedTime);
    
    // Fallback alerts if user clicks save with bad data
    if (toSchedule.length === 0) return alert("Please assign a time to at least one selected candidate.");
    if (!date) return alert("Please select an interview date.");

    setLoading(true);

    const payload = toSchedule.map(c => ({
      candidateId: c.id,
      date: date,
      startTime: c.assignedTime,
      durationMinutes: duration,
      type: meetingLink ? 'ONLINE' : 'IN_PERSON',
      location: meetingLink || null 
    }));

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: payload })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Database Error: ${errorData.error || 'Failed to save schedule.'}`);
      }
    } catch (error) {
      alert("Network Error: Could not connect to the server.");
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
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
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Duration</label>
                  <div className="relative">
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                    <span className="absolute right-3 top-2.5 text-xs text-neutral-400">m</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Buffer (Between Interviews)</label>
                <div className="relative">
                  <input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
                  <span className="absolute right-3 top-2.5 text-xs text-neutral-400">m</span>
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

            {/* Meet Link */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5"><LinkIcon size={14} /> Online Meeting</h3>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Google Meet / Zoom Link</label>
                <input type="url" placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black" />
              </div>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={handleAutoFill}
                disabled={selectedCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Sparkles size={16} /> Auto-Fill Selected
              </button>
            </div>
          </div>

          {/* Right Column: Candidate List */}
          <div className="flex-1 p-6 flex flex-col bg-white overflow-hidden">
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black"
                />
                Select All
              </label>
              
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-neutral-500" />
                <select 
                  value={positionFilter} 
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="text-sm bg-transparent border-none font-medium text-neutral-700 focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="ALL">All Positions</option>
                  {uniquePositions.map((pos: any) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
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
                      <input 
                        type="checkbox" 
                        checked={c.selected} 
                        onChange={() => toggleCandidate(c.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{c.name}</div>
                        <div className="text-xs text-neutral-500">{c.position}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        value={c.assignedTime}
                        onChange={(e) => handleManualTimeChange(c.id, e.target.value)}
                        className={`px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-colors ${c.assignedTime ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-neutral-200 text-neutral-500'}`}
                      />
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
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-sm transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || selectedCount === 0 || !scheduleData.some(c => c.selected && c.assignedTime)}
              className="px-6 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}