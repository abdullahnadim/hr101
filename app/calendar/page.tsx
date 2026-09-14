'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, User, LayoutGrid, Columns, List } from 'lucide-react';
import { 
  startOfWeek, endOfWeek, addDays, subDays, format, isSameDay, isToday, 
  startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, subWeeks, 
  addMonths, subMonths, isSameMonth 
} from 'date-fns';

export default function CalendarPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View State: 'day' | 'week' | 'month'
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => {
        setCandidates(Array.isArray(data) ? data : []);
        setIsLoading(false);
      });
  }, []);

  // --- Date Math (Week Starts on Sunday: weekStartsOn 0) ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // --- Navigation Logic ---
  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(prev => subDays(prev, 1));
    if (view === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    if (view === 'month') setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, 1));
    if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    if (view === 'month') setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // --- Header Formatting ---
  let headerDateText = '';
  if (view === 'day') headerDateText = format(currentDate, 'MMMM d, yyyy');
  if (view === 'week') headerDateText = `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
  if (view === 'month') headerDateText = format(currentDate, 'MMMM yyyy');

  // --- Filter Logic ---
  const getInterviewsForDay = (day: Date) => {
    return candidates
      .filter(c => {
        if (!c.interview || !c.interview.date) return false;
        const interviewDate = new Date(c.interview.date);
        return isSameDay(interviewDate, day);
      })
      .sort((a, b) => a.interview.startTime.localeCompare(b.interview.startTime));
  };

  // Reusable component for the interview card
  const InterviewCard = ({ candidate }: { candidate: any }) => (
    <div className="group bg-white p-3 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md hover:border-black transition-all cursor-default">
      <div className="flex justify-between items-start mb-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
          <Clock size={10} />
          {candidate.interview.startTime}
        </span>
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
          {candidate.interview.durationMinutes}m
        </span>
      </div>
      <div className="font-semibold text-sm text-neutral-900 truncate">
        {candidate.name}
      </div>
      <div className="text-xs text-neutral-500 truncate flex items-center gap-1 mt-0.5">
        <User size={12} className="shrink-0" />
        {candidate.position}
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs font-medium">
        {candidate.interview.type === 'ONLINE' ? (
          <a href={candidate.interview.location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
            <Video size={12} /> Google Meet
          </a>
        ) : (
          <span className="flex items-center gap-1 text-neutral-600">
            <MapPin size={12} /> {candidate.interview.location || 'In-Person'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <CalendarIcon size={20} className="text-neutral-500" />
            Interview Calendar
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* View Switcher */}
          <div className="flex bg-neutral-100 p-1 rounded-lg w-full md:w-auto">
            <button onClick={() => setView('day')} className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'day' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-black'}`}>
              <List size={14} /> Day
            </button>
            <button onClick={() => setView('week')} className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-black'}`}>
              <Columns size={14} /> Week
            </button>
            <button onClick={() => setView('month')} className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-black'}`}>
              <LayoutGrid size={14} /> Month
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-white border border-neutral-200 p-1 rounded-lg shadow-sm w-full md:w-auto justify-between md:justify-start">
            <button onClick={handlePrevious} className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-sm font-semibold text-neutral-800 min-w-[150px] text-center">
              {headerDateText}
            </div>
            <button onClick={handleNext} className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors">
              <ChevronRight size={18} />
            </button>
            <div className="w-px h-5 bg-neutral-200 mx-1 hidden md:block"></div>
            <button onClick={handleToday} className="hidden md:block px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-md transition-colors">
              Today
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">Loading calendar...</div>
        ) : (
          <div className="flex-1 bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            
            {/* --- MONTH VIEW --- */}
            {view === 'month' && (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2.5 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 border-r border-neutral-100 last:border-0">{day}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                  {monthDays.map((day, i) => {
                    const dayInterviews = getInterviewsForDay(day);
                    const isCurrMonth = isSameMonth(day, currentDate);
                    const isCurrDay = isToday(day);
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => { setCurrentDate(day); setView('day'); }}
                        className={`p-1.5 border-r border-b border-neutral-100 min-h-[120px] cursor-pointer hover:bg-neutral-50 transition-colors ${!isCurrMonth ? 'bg-neutral-50/40' : 'bg-white'}`}
                      >
                        <div className="flex justify-end mb-1">
                          <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isCurrDay ? 'bg-blue-600 text-white' : !isCurrMonth ? 'text-neutral-400' : 'text-neutral-700'}`}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {dayInterviews.slice(0, 3).map(c => (
                            <div key={c.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-1 rounded truncate border border-blue-100 font-medium">
                              {c.interview.startTime} - {c.name.split(' ')[0]}
                            </div>
                          ))}
                          {dayInterviews.length > 3 && (
                            <div className="text-[10px] text-neutral-500 font-medium px-1">+{dayInterviews.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- WEEK VIEW --- */}
            {view === 'week' && (
              <div className="flex flex-col h-full overflow-x-auto">
                <div className="grid grid-cols-7 border-b border-neutral-200 min-w-[1000px]">
                  {weekDays.map((day, i) => {
                    const isCurrentDay = isToday(day);
                    return (
                      <div key={i} className={`p-4 border-r border-neutral-100 last:border-r-0 text-center ${isCurrentDay ? 'bg-blue-50/50' : 'bg-neutral-50'}`}>
                        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">{format(day, 'EEEE')}</div>
                        <div className={`text-xl font-bold ${isCurrentDay ? 'text-blue-600' : 'text-neutral-900'}`}>{format(day, 'd')}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1 grid grid-cols-7 min-w-[1000px] overflow-y-auto bg-white">
                  {weekDays.map((day, i) => {
                    const dayInterviews = getInterviewsForDay(day);
                    return (
                      <div key={i} className={`p-3 border-r border-neutral-100 last:border-r-0 min-h-[500px] ${isToday(day) ? 'bg-blue-50/10' : ''}`}>
                        <div className="space-y-3">
                          {dayInterviews.map(c => <InterviewCard key={c.id} candidate={c} />)}
                          {dayInterviews.length === 0 && <div className="text-center py-4 text-neutral-300 text-xs italic">No interviews</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- DAY VIEW --- */}
            {view === 'day' && (
              <div className="flex flex-col h-full overflow-y-auto bg-neutral-50/30 p-4 md:p-6">
                <div className="max-w-3xl mx-auto w-full space-y-4">
                  {getInterviewsForDay(currentDate).length === 0 ? (
                    <div className="text-center py-20 bg-white border border-neutral-200 rounded-xl">
                      <CalendarIcon size={32} className="mx-auto text-neutral-300 mb-3" />
                      <h3 className="text-neutral-900 font-medium">No interviews scheduled</h3>
                      <p className="text-neutral-500 text-sm mt-1">Enjoy your free day.</p>
                    </div>
                  ) : (
                    getInterviewsForDay(currentDate).map(c => (
                      <div key={c.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex flex-col items-center justify-center min-w-[100px]">
                          <span className="text-lg font-bold">{c.interview.startTime}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{c.interview.durationMinutes} MIN</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-neutral-900">{c.name}</h4>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-neutral-500">
                            <span className="flex items-center gap-1"><User size={14} /> {c.position}</span>
                            <span className="flex items-center gap-1">
                              {c.interview.type === 'ONLINE' ? <Video size={14} /> : <MapPin size={14} />} 
                              {c.interview.location || 'In-Person'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}