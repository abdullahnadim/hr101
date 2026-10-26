'use client';
import { useState, useEffect } from 'react';
import { PlayCircle, Copy, Mail, MessageSquare, Edit2, Trash2, Filter, Check, Send, Loader2, Search } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import EditCandidateModal from './EditCandidateModal';

export default function CandidateTable({ 
  candidates, 
  refreshData,
  selectedIds,           // <-- NEW PROP
  onSelectionChange      // <-- NEW PROP
}: { 
  candidates: any[], 
  refreshData: () => void,
  selectedIds: string[],
  onSelectionChange: (ids: string[]) => void
}) {
  const [mounted, setMounted] = useState(false);
  
  // Blast API State
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<Record<string, 'success' | 'failed'>>({});
  
  // Manual Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'email' | 'sms' | null>(null);
  
  // Filter, Search, & Edit State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  const { emailTemplate, smsTemplate, whatsappTemplate } = useSettingsStore();

  useEffect(() => setMounted(true), []);

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

  // --- SELECTION LOGIC (UPDATED TO USE PROPS) ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filteredList: any[]) => {
    if (e.target.checked) {
      onSelectionChange(filteredList.map(c => c.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
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

  const openEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setIsEditOpen(true);
  };

  // --- TEMPLATE RENDERING ---
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

  // --- MANUAL COPY & MAILTO LOGIC ---
  const handleCopy = async (candidate: any, type: 'email' | 'sms') => {
    const templateToUse = type === 'email' ? emailTemplate : smsTemplate;
    const finalMessage = renderMessage(templateToUse, candidate);
    
    await navigator.clipboard.writeText(finalMessage);
    
    setCopiedId(candidate.id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const handleMailTo = (candidate: any) => {
    const finalMessage = renderMessage(emailTemplate, candidate);
    const subject = encodeURIComponent(`Interview Invitation: ${candidate.position}`);
    const body = encodeURIComponent(finalMessage);
    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
  };

  // --- WHATSAPP DIRECT MESSAGE ---
  const handleWhatsAppDirect = (candidate: any) => {
    let phone = candidate.phone ? candidate.phone.replace(/\D/g, '') : '';
    if (!phone) {
      alert("This candidate does not have a valid phone number on file.");
      return;
    }

    if (phone.startsWith('01') && phone.length === 11) {
      phone = `88${phone}`;
    }

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

  // --- LIVE API DISPATCHER LOGIC ---
  const handleBlast = async (candidate: any) => {
    setSendingId(candidate.id);
    const emailFinal = renderMessage(emailTemplate, candidate);
    const smsFinal = renderMessage(smsTemplate, candidate);
    const subject = `Interview Invitation: ${candidate.position}`;

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          email: candidate.email,
          phone: candidate.phone,
          subject,
          emailBody: emailFinal,
          smsBody: smsFinal
        })
      });

      if (res.ok) {
        setSentStatus(prev => ({ ...prev, [candidate.id]: 'success' }));
        refreshData(); 
      } else {
        setSentStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
      }
    } catch (e) {
      setSentStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
    }
    
    setSendingId(null);
    setTimeout(() => {
      setSentStatus(prev => {
        const newState = { ...prev };
        delete newState[candidate.id];
        return newState;
      });
    }, 3000);
  };

  // --- FILTERS & SEARCH ---
  const uniquePositions = Array.from(new Set(candidates.map(c => c.position).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(candidates.map(c => c.status).filter(Boolean)));
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

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 p-4 border-b border-neutral-100 bg-neutral-50/50">
        
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm border-none bg-transparent focus:ring-0 text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
            <Filter size={14} className="text-neutral-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border-none bg-transparent focus:ring-0 text-neutral-700 font-medium cursor-pointer outline-none">
              <option value="ALL">All Statuses</option>
              {uniqueStatuses.map((s: any) => <option key={s} value={s}>{s}</option>)}
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-3 flex justify-between items-center transition-all">
          <span className="text-sm font-semibold text-blue-800 tracking-tight">
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-md shadow-sm transition-colors">
              <Trash2 size={14} /> Delete Selected
            </button>
            <button onClick={() => onSelectionChange([])} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                  checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length}
                  onChange={(e) => handleSelectAll(e, filteredCandidates)}
                />
              </th>
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredCandidates.map((c) => (
              <tr key={c.id} className={`hover:bg-neutral-50/50 transition-colors group ${selectedIds.includes(c.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => handleSelectOne(c.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-neutral-900">{c.name}</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">ID: {c.id.split('-')[0]}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-neutral-700">{c.phone}</div>
                  <div className="text-xs text-neutral-500">{c.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-neutral-900">{c.position}</div>
                  <div className="text-xs text-neutral-500">{c.department || 'No Dept'}</div>
                </td>
                <td className="px-6 py-4">
                  {c.interview ? (
                    <div>
                      <div className="font-semibold text-neutral-900">{formatTime(c.interview.startTime)}</div>
                      <div className="text-xs text-neutral-500">{formatDate(c.interview.date)}</div>
                    </div>
                  ) : (
                    <span className="text-neutral-400 italic text-xs">Not scheduled</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}>
                      {c.status}
                    </span>
                    {c.messageStatus && c.messageStatus !== 'NOT_SENT' && (
                      <span className="text-[10px] font-semibold text-blue-600 tracking-wider">
                        {c.messageStatus === 'BOTH' ? 'NOTIFIED' : `${c.messageStatus.replace('_SENT', '')} SENT`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    
                    <button 
                      onClick={() => handleBlast(c)}
                      disabled={sendingId === c.id || !c.interview}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all shadow-sm ${
                        sentStatus[c.id] === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        sentStatus[c.id] === 'failed' ? 'bg-red-50 border-red-200 text-red-700' :
                        !c.interview ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed' :
                        'bg-black border-black text-white hover:bg-neutral-800'
                      }`}
                      title={!c.interview ? 'Schedule candidate first' : 'Auto-Send Email & SMS'}
                    >
                      {sendingId === c.id ? <Loader2 size={14} className="animate-spin" /> : 
                       sentStatus[c.id] === 'success' ? <Check size={14} /> : 
                       <Send size={14} />}
                      {sendingId === c.id ? 'Sending...' : sentStatus[c.id] === 'success' ? 'Sent' : 'Blast'}
                    </button>

                    <div className="w-px h-5 bg-neutral-200 mx-1 hidden md:block"></div>

                    <button onClick={() => handleCopy(c, 'email')} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" title="Copy Email Template">
                      {copiedId === c.id && copiedType === 'email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>

                    <button onClick={() => handleCopy(c, 'sms')} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" title="Copy SMS Template">
                      {copiedId === c.id && copiedType === 'sms' ? <Check size={14} className="text-emerald-600" /> : <MessageSquare size={14} />}
                    </button>

                    <button onClick={() => handleMailTo(c)} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all shadow-sm" title="Open in Native Mail App">
                      <Mail size={14} />
                    </button>

                    <button onClick={() => handleWhatsAppDirect(c)} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm" title="Message on WhatsApp">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    </button>

                    <div className="w-px h-5 bg-neutral-200 mx-1 hidden md:block"></div>

                    <button onClick={() => openEdit(c)} title="Edit Candidate" className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                      <Edit2 size={14} />
                    </button>

                    <button onClick={() => handleDelete(c.id)} title="Delete Candidate" className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                      <Trash2 size={14} />
                    </button>
                    
                    <a href={`/interview/${c.id}`} className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm" title="Start Interview">
                      <PlayCircle size={14} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">
                  {searchTerm ? 'No candidates found matching your search.' : 'No candidates available.'}
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