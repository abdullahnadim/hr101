'use client';
import { useState, useEffect } from 'react';
import { 
  PlayCircle, Copy, Mail, MessageSquare, Edit2, Trash2, Filter, 
  Check, Send, Loader2, Search, CalendarClock, XCircle, Phone, Star 
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import EditCandidateModal from './EditCandidateModal';

export default function CandidateTable({ 
  candidates, 
  refreshData,
  selectedIds,           
  onSelectionChange,     
  onOpenSchedule         
}: { 
  candidates: any[], 
  refreshData: () => void,
  selectedIds: string[],
  onSelectionChange: (ids: string[]) => void,
  onOpenSchedule: () => void
}) {
  const [mounted, setMounted] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<Record<string, 'success' | 'failed'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'email' | 'sms' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  const { emailTemplate, smsTemplate, whatsappTemplate } = useSettingsStore();

  useEffect(() => setMounted(true), []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString: string, includeTz: boolean = false) => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}${includeTz ? ' (BD Time)' : ''}`;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filteredList: any[]) => {
    if (e.target.checked) onSelectionChange(filteredList.map(c => c.id));
    else onSelectionChange([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected candidates?`)) return;
    await Promise.all(selectedIds.map(id => fetch(`/api/candidates/${id}`, { method: 'DELETE' })));
    onSelectionChange([]);
    refreshData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
    if (res.ok) refreshData();
  };

  const handleMarkRejected = async (id: string) => {
    if (!confirm('Mark candidate as Not Selected / Rejected?')) return;
    const res = await fetch(`/api/candidates/${id}`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' })
    });
    if (res.ok) refreshData();
  };

  const openEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setIsEditOpen(true);
  };

  const handleReschedule = (candidateId: string) => {
    onSelectionChange([candidateId]); 
    onOpenSchedule(); 
  };

  const renderMessage = (template: string, candidate: any) => {
    const dateStr = candidate.interview?.date ? formatDate(candidate.interview.date) : 'TBD';
    const timeStr = candidate.interview?.startTime ? formatTime(candidate.interview.startTime, true) : 'TBD';
    return template
      .replace(/\{\{candidate_name\}\}/g, candidate.name || '')
      .replace(/\{\{position\}\}/g, candidate.position || '')
      .replace(/\{\{interview_date\}\}/g, dateStr)
      .replace(/\{\{interview_time\}\}/g, timeStr)
      .replace(/\{\{interview_duration\}\}/g, candidate.interview?.durationMinutes || '30');
  };

  const handleCopy = async (candidate: any, type: 'email' | 'sms') => {
    const templateToUse = type === 'email' ? emailTemplate : smsTemplate;
    const finalMessage = renderMessage(templateToUse, candidate);
    await navigator.clipboard.writeText(finalMessage);
    setCopiedId(candidate.id);
    setCopiedType(type);
    setTimeout(() => { setCopiedId(null); setCopiedType(null); }, 2000);
  };

  const handleMailTo = (candidate: any) => {
    const finalMessage = renderMessage(emailTemplate, candidate);
    const subject = encodeURIComponent(`Interview: ${candidate.position}`);
    const body = encodeURIComponent(finalMessage);
    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppDirect = (candidate: any) => {
    let phone = candidate.phone ? candidate.phone.replace(/\D/g, '') : '';
    if (!phone) { alert("This candidate does not have a valid phone number on file."); return; }
    if (phone.startsWith('01') && phone.length === 11) phone = `88${phone}`;

    let finalMessage = '';
    if (candidate.interview) {
      const dateStr = candidate.interview?.date ? formatDate(candidate.interview.date) : 'TBD';
      const timeStr = candidate.interview?.startTime ? formatTime(candidate.interview.startTime, true) : 'TBD';
      finalMessage = (whatsappTemplate || '')
        .replace(/\{\{candidate_name\}\}/g, candidate.name || 'Candidate')
        .replace(/\{\{position\}\}/g, candidate.position || 'the position')
        .replace(/\{\{interview_date\}\}/g, dateStr)
        .replace(/\{\{interview_time\}\}/g, timeStr)
        .replace(/\{\{interview_duration\}\}/g, candidate.interview?.durationMinutes || '30');
    } else {
      finalMessage = `Hi ${candidate.name}, this is regarding your application for the ${candidate.position} position. Do you have a moment to chat?`;
    }

    const encodedMessage = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleBlast = async (candidate: any) => {
    setSendingId(candidate.id);
    const emailFinal = renderMessage(emailTemplate, candidate);
    const smsFinal = renderMessage(smsTemplate, candidate);
    const subject = `Interview Invitation: ${candidate.position}`;

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, email: candidate.email, phone: candidate.phone, subject, emailBody: emailFinal, smsBody: smsFinal })
      });
      if (res.ok) { setSentStatus(prev => ({ ...prev, [candidate.id]: 'success' })); refreshData(); } 
      else setSentStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
    } catch (e) { setSentStatus(prev => ({ ...prev, [candidate.id]: 'failed' })); }
    
    setSendingId(null);
    setTimeout(() => {
      setSentStatus(prev => {
        const newState = { ...prev };
        delete newState[candidate.id];
        return newState;
      });
    }, 3000);
  };

  const uniquePositions = Array.from(new Set(candidates.map(c => c.position).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(['NEW', 'SCHEDULED', 'RESCHEDULED', 'INTERVIEWED', 'HIRED', 'REJECTED', ...candidates.map(c => c.status).filter(Boolean)]));
  const uniqueDepartments = Array.from(new Set(candidates.map(c => c.department).filter(Boolean)));

  const filteredCandidates = candidates.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      (c.name && c.name.toLowerCase().includes(searchLower)) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.includes(searchTerm));
      
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchPosition = positionFilter === 'ALL' || c.position === positionFilter;
    const matchDepartment = departmentFilter === 'ALL' || c.department === departmentFilter;
    
    return matchSearch && matchStatus && matchPosition && matchDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HIRED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESCHEDULED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NEW': return 'bg-neutral-800 text-white border-black';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  // Helper to render score badges
  const renderScore = (score?: number) => {
    if (score === undefined || score === null) return <span className="text-neutral-300 text-xs italic">Pending</span>;
    let colorClass = 'text-neutral-600 bg-neutral-100';
    if (score >= 80) colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    else if (score >= 60) colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    else colorClass = 'text-red-700 bg-red-50 border-red-200';
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold ${colorClass}`}>
        <Star size={10} className={score >= 80 ? 'fill-emerald-600' : ''} /> {score}/100
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col h-full min-h-[600px]">
      
      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
          <Search size={16} className="text-neutral-400" />
          <input type="text" placeholder="Search by name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full text-sm border-none bg-transparent focus:ring-0 text-neutral-900 outline-none placeholder:text-neutral-400" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
            <Filter size={14} className="text-neutral-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border-none bg-transparent focus:ring-0 text-neutral-700 font-medium cursor-pointer outline-none">
              <option value="ALL">All Statuses</option>
              {uniqueStatuses.map((s: any) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
            <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="text-sm border-none bg-transparent focus:ring-0 text-neutral-700 font-medium cursor-pointer outline-none">
              <option value="ALL">All Positions</option>
              {uniquePositions.map((p: any) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="text-sm border-none bg-transparent focus:ring-0 text-neutral-700 font-medium cursor-pointer outline-none">
              <option value="ALL">All Depts</option>
              {uniqueDepartments.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-3 flex justify-between items-center transition-all animate-in slide-in-from-top-2">
          <span className="text-sm font-semibold text-blue-800 tracking-tight">{selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-md shadow-sm transition-colors">
              <Trash2 size={14} /> Delete Selected
            </button>
            <button onClick={() => onSelectionChange([])} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Clear</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500 border-b border-neutral-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length} onChange={(e) => handleSelectAll(e, filteredCandidates)} /></th>
              <th className="px-6 py-4">Candidate & Contact</th>
              <th className="px-6 py-4">Role & Dept</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredCandidates.map((c) => (
              <tr key={c.id} className={`hover:bg-neutral-50/50 transition-colors group ${selectedIds.includes(c.id) ? 'bg-blue-50/30' : ''}`}>
                
                {/* SELECT */}
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" checked={selectedIds.includes(c.id)} onChange={() => handleSelectOne(c.id)} />
                </td>
                
                {/* CANDIDATE & CONTACT */}
                <td className="px-6 py-4">
                  <div className="font-bold text-neutral-900 text-base">{c.name}</div>
                  <div className="font-medium text-neutral-500 text-xs mt-1 flex flex-col gap-0.5">
                    <span>{c.email}</span>
                    <span>{c.phone}</span>
                  </div>
                </td>
                
                {/* ROLE */}
                <td className="px-6 py-4">
                  <div className="font-bold text-neutral-900">{c.position}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 font-medium">{c.department || 'No Dept'}</div>
                </td>
                
                {/* SCHEDULE */}
                <td className="px-6 py-4">
                  {c.interview ? (
                    <div>
                      <div className="font-bold text-neutral-900">{formatTime(c.interview.startTime)}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 font-medium">{formatDate(c.interview.date)}</div>
                    </div>
                  ) : (
                    <span className="text-neutral-400 italic text-xs">Not scheduled</span>
                  )}
                </td>

                {/* SCORE */}
                <td className="px-6 py-4">
                  {renderScore(c.score || c.interview?.score)}
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={`inline-flex rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusBadge(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    {c.messageStatus && c.messageStatus !== 'NOT_SENT' && (
                      <span className="text-[9px] font-black text-blue-600 tracking-wider">
                        {c.messageStatus === 'BOTH' ? 'NOTIFIED' : `${c.messageStatus.replace('_SENT', '')} SENT`}
                      </span>
                    )}
                  </div>
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-end items-center gap-1.5 opacity-100 md:opacity-20 md:group-hover:opacity-100 transition-opacity">
                    
                    {/* Comm Group */}
                    <div className="flex bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden">
                      <a href={`tel:${c.phone}`} title="Call Candidate" className="p-1.5 hover:bg-neutral-100 hover:text-blue-600 transition-colors border-r border-neutral-200 text-neutral-600">
                        <Phone size={14} />
                      </a>
                      <button onClick={() => handleWhatsAppDirect(c)} title="WhatsApp Message" className="p-1.5 hover:bg-neutral-100 hover:text-emerald-600 transition-colors border-r border-neutral-200 text-neutral-600">
                        <MessageSquare size={14} />
                      </button>
                      <button onClick={() => handleMailTo(c)} title="Send Email" className="p-1.5 hover:bg-neutral-100 hover:text-blue-600 transition-colors border-r border-neutral-200 text-neutral-600">
                        <Mail size={14} />
                      </button>
                      <button onClick={() => handleBlast(c)} disabled={sendingId === c.id || !c.interview} title="Auto-Send Invites (Email & SMS)" className="p-1.5 hover:bg-neutral-100 hover:text-purple-600 transition-colors text-neutral-600 disabled:opacity-50">
                        {sendingId === c.id ? <Loader2 size={14} className="animate-spin" /> : sentStatus[c.id] === 'success' ? <Check size={14} className="text-emerald-600"/> : <Send size={14} />}
                      </button>
                    </div>

                    {/* Mgmt Group */}
                    <div className="flex bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden ml-1">
                      <button onClick={() => handleReschedule(c.id)} title="Schedule / Reschedule" className="p-1.5 hover:bg-amber-50 hover:text-amber-600 transition-colors border-r border-neutral-200 text-neutral-600">
                        <CalendarClock size={14} />
                      </button>
                      <button onClick={() => openEdit(c)} title="Edit Profile" className="p-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors border-r border-neutral-200 text-neutral-600">
                        <Edit2 size={14} />
                      </button>
                      {c.status !== 'REJECTED' && c.status !== 'HIRED' && (
                        <button onClick={() => handleMarkRejected(c.id)} title="Reject / Not Selected" className="p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors border-r border-neutral-200 text-neutral-600">
                          <XCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)} title="Delete Candidate" className="p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors text-neutral-600">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Start Interview (Highlight) */}
                    <a href={`/interview/${c.id}`} className="ml-1 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-neutral-800 transition-colors shadow-sm" title="Start Interview Module">
                      <PlayCircle size={14} /> Start
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-sm font-medium text-neutral-400">
                  {searchTerm ? 'No candidates found matching your criteria.' : 'No candidates in the directory yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditCandidateModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} candidate={editingCandidate} onSuccess={refreshData} />
    </div>
  );
}