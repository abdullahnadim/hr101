'use client';
import { useEffect, useState } from 'react';
import CSVImporter from '@/components/CSVImporter';
import CandidateTable from '@/components/CandidateTable';
import AddCandidateModal from '@/components/AddCandidateModal';
import ScheduleModal from '@/components/ScheduleModal';
import ExportCandidatesModal from '@/components/ExportCandidatesModal';
import BulkMessageModal from '@/components/BulkMessageModal'; // NEW: Import the Bulk Message Modal
import { Plus, Users, Calendar as CalendarIcon, Download, MessageSquare } from 'lucide-react';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // NEW: Bulk Message Modal State
  
  // Track selected candidates for export, scheduling, & messaging
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <Users size={20} className="text-neutral-500" />
            Candidate Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage, update, and track all candidates in your pipeline</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          
          {/* CONTEXTUAL ACTION: Only show when candidates are selected */}
          {selectedIds.length > 0 && (
            <div className="flex gap-3 w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-200">
              {/* NEW: Bulk Message Button */}
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
              >
                <MessageSquare size={16} /> Message ({selectedIds.length})
              </button>

              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Download size={16} /> Export ({selectedIds.length})
              </button>
            </div>
          )}

          {/* Persistent Actions */}
          <CSVImporter onImportSuccess={fetchCandidates} />
          
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-neutral-700 bg-white border border-neutral-200 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <CalendarIcon size={16} /> {selectedIds.length > 0 ? `Schedule (${selectedIds.length})` : 'Schedule'}
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-bold shadow-sm"
          >
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto flex-1 w-full space-y-6">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-20 text-neutral-400 text-sm">Loading directory...</div>
          ) : (
            <CandidateTable 
              candidates={candidates} 
              refreshData={fetchCandidates} 
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onOpenSchedule={() => setIsScheduleModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      <AddCandidateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAddCandidate} 
      />
      
      {/* Schedule Modal now accepts selected candidates explicitly if they exist */}
      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        candidates={selectedIds.length > 0 ? selectedCandidates : candidates}
        onSuccess={() => {
          fetchCandidates();
          setSelectedIds([]); // Clear selection after scheduling
        }}
      />
      
      <ExportCandidatesModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        selectedCandidates={selectedCandidates} 
      />

      {/* NEW: Bulk Messaging Modal Integration */}
      <BulkMessageModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        selectedCandidateIds={selectedIds}
        onSuccess={() => {
          alert("Messages dispatched successfully!");
          setSelectedIds([]); // Clear selection after sending
        }}
      />
    </>
  );
}