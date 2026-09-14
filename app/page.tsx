'use client';
import { useEffect, useState } from 'react';
import ScheduleModal from '@/components/ScheduleModal';
import { Play, Calendar as CalendarIcon, Users, Clock, ArrowRight, Video, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const fetchCandidates = () => {
    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => {
        setCandidates(Array.isArray(data) ? data : []);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Calculate dynamic metrics
  const pendingCandidates = candidates.filter(c => c.status === 'NEW' || c.status === 'RESCHEDULED');
  const scheduledCandidates = candidates.filter(c => c.status === 'SCHEDULED' && c.interview);
  
  const today = new Date().toDateString();
  const scheduledToday = scheduledCandidates.filter(c => 
    new Date(c.interview.date).toDateString() === today
  );

  // Sort upcoming interviews chronologically and take the top 6
  const upcomingInterviews = [...scheduledCandidates].sort((a, b) => {
    const dateA = new Date(`${a.interview.date.split('T')[0]}T${a.interview.startTime}`);
    const dateB = new Date(`${b.interview.date.split('T')[0]}T${b.interview.startTime}`);
    return dateA.getTime() - dateB.getTime();
  }).slice(0, 6);

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">Your high-level metrics and upcoming schedule</p>
        </div>
        
        <button 
          onClick={() => setIsScheduleModalOpen(true)}
          disabled={pendingCandidates.length === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={14} fill="currentColor" /> 
          Auto-Schedule Pending ({pendingCandidates.length})
        </button>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
        
        {/* Dynamic Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <Users size={16} />
              <span className="text-sm font-medium">Total Pipeline</span>
            </div>
            <span className="text-3xl font-semibold text-neutral-900">{candidates.length}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium">Pending Action</span>
            </div>
            <span className="text-3xl font-semibold text-neutral-900">{pendingCandidates.length}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <CalendarIcon size={16} />
              <span className="text-sm font-medium">Scheduled Total</span>
            </div>
            <span className="text-3xl font-semibold text-neutral-900">{scheduledCandidates.length}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CalendarIcon size={16} />
              <span className="text-sm font-medium">Scheduled Today</span>
            </div>
            <span className="text-3xl font-semibold text-neutral-900">{scheduledToday.length}</span>
          </div>
        </div>

        {/* Upcoming Interviews Section */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="font-semibold text-neutral-800">Upcoming Interviews</h2>
            <Link href="/calendar" className="text-sm font-medium text-neutral-500 hover:text-black flex items-center gap-1 transition-colors">
              View Calendar <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-10 text-neutral-400 text-sm">Loading upcoming schedule...</div>
            ) : upcomingInterviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingInterviews.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-lg border border-neutral-200 hover:border-black transition-colors bg-neutral-50/50 flex flex-col gap-3">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm">{c.name}</div>
                        <div className="text-xs text-neutral-500">{c.position}</div>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                        {c.interview.startTime}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-neutral-200 flex justify-between items-center text-xs">
                      <div className="text-neutral-500 font-medium">
                        {new Date(c.interview.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        {c.interview.type === 'ONLINE' ? (
                          <span className="text-blue-600 flex items-center gap-1"><Video size={12} /> Online</span>
                        ) : (
                          <span className="text-neutral-600 flex items-center gap-1"><MapPin size={12} /> In-Person</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                  <CalendarIcon size={24} className="text-neutral-400" />
                </div>
                <h3 className="text-neutral-900 font-medium mb-1">No upcoming interviews</h3>
                <p className="text-neutral-500 text-sm mb-4">You don't have any candidates scheduled yet.</p>
                {pendingCandidates.length > 0 && (
                  <button 
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Auto-Schedule Pending Candidates
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        candidates={candidates}
        onSuccess={fetchCandidates}
      />
    </>
  );
}