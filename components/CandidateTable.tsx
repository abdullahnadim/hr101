'use client';
import { useState, useEffect } from 'react';
import { Copy, Mail, MessageSquare, Edit2, Trash2, Filter, Check, Send, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import EditCandidateModal from './EditCandidateModal';

export default function CandidateTable({ candidates, refreshData }: { candidates: any[], refreshData: () => void }) {
  const [mounted, setMounted] = useState(false);
  
  // Blast API State
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<Record<string, 'success' | 'failed'>>({});
  
  // Manual Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'email' | 'sms' | null>(null);
  
  // Filter & Edit State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  const { emailTemplate, smsTemplate } = useSettingsStore();

  useEffect(() => setMounted(true), []);

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
    const dateStr = candidate.interview?.date ? new Date(candidate.interview.date).toLocaleDateString() : 'TBD';
    return template
      .replace(/\{\{candidate_name\}\}/g, candidate.name || '')
      .replace(/\{\{position\}\}/g, candidate.position || '')
      .replace(/\{\{interview_date\}\}/g, dateStr)
      .replace(/\{\{interview_time\}\}/g, candidate.interview?.startTime || 'TBD')
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

  // --- FILTERS ---
  const uniquePositions = Array.from(new Set(candidates.map(c => c.position).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(candidates.map(c => c.status).filter(Boolean)));
  const uniqueDepartments = Array.from(new Set(candidates.map(c => c.department).filter(Boolean)));

  const filteredCandidates = candidates.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchPosition = positionFilter === 'ALL' || c.position === positionFilter;
    const matchDepartment = departmentFilter === 'ALL' || c.department === departmentFilter;
    return matchStatus && matchPosition && matchDepartment;
  });

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 p-4 border-b border-neutral-100 bg-neutral-50/50">
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200">
            <tr>
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
              <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
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
                      <div className="font-semibold text-neutral-900">{c.interview.startTime}</div>
                      <div className="text-xs text-neutral-500">{new Date(c.interview.date).toLocaleDateString()}</div>
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
                    
                    {/* Primary Blast Button */}
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

                    {/* Copy Email Button */}
                    <button 
                      onClick={() => handleCopy(c, 'email')}
                      className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      title="Copy Email Template"
                    >
                      {copiedId === c.id && copiedType === 'email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>

                    {/* Copy SMS Button */}
                    <button 
                      onClick={() => handleCopy(c, 'sms')}
                      className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      title="Copy SMS Template"
                    >
                      {copiedId === c.id && copiedType === 'sms' ? <Check size={14} className="text-emerald-600" /> : <MessageSquare size={14} />}
                    </button>

                    {/* Open in Email App Button */}
                    <button 
                      onClick={() => handleMailTo(c)}
                      className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      title="Open in Native Mail App"
                    >
                      <Mail size={14} />
                    </button>

                    <div className="w-px h-5 bg-neutral-200 mx-1 hidden md:block"></div>

                    {/* Edit & Delete */}
                    <button onClick={() => openEdit(c)} title="Edit Candidate" className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                      <Edit2 size={14} />
                    </button>

                    <button onClick={() => handleDelete(c.id)} title="Delete Candidate" className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                      <Trash2 size={14} />
                    </button>
                    
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditCandidateModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} candidate={editingCandidate} onSuccess={refreshData} />
    </div>
  );
}