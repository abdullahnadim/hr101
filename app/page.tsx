'use client';
import { useEffect, useState } from 'react';
import CSVImporter from '@/components/CSVImporter';
import ScheduleModal from '@/components/ScheduleModal';
import CandidateTable from '@/components/CandidateTable';
import AddCandidateModal from '@/components/AddCandidateModal';
import { Plus, Play } from 'lucide-react';

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Extracted fetch function so we can easily refresh the table after actions
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

  const handleAddCandidate = (newCandidate: any) => {
    setCandidates(prev => [newCandidate, ...prev]);
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Interview Scheduler</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage and schedule candidates efficiently</p>
        </div>
        <div className="flex gap-3">
          <CSVImporter onImportSuccess={fetchCandidates} />
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Minimal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Candidates', value: candidates.length },
            { label: 'Scheduled Today', value: '0' },
            { label: 'Pending Action', value: candidates.filter((c: any) => c.status === 'NEW').length },
            { label: 'Messages Sent', value: '0' },
          ].map((metric, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <span className="text-sm font-medium text-neutral-500">{metric.label}</span>
              <span className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Table Area */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="font-semibold text-neutral-800">Candidate Pipeline</h2>
            
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Play size={14} fill="currentColor" /> Auto-Schedule
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-20 text-neutral-400 text-sm">Loading data...</div>
          ) : (
            <CandidateTable candidates={candidates} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCandidateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAddCandidate}
      />

      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        candidates={candidates}
        onSuccess={fetchCandidates}
      />
      
    </>
  );
}