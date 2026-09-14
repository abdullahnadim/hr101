'use client';
import { useState, useEffect } from 'react';
import { Check, Copy, Mail, MessageSquare } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function CandidateTable({ candidates }: { candidates: any[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'email' | 'sms' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Pull templates from global settings
  const { emailTemplate, smsTemplate } = useSettingsStore();

  useEffect(() => setMounted(true), []);

  // Helper to dynamically replace {{variables}} with candidate data
  const renderMessage = (template: string, candidate: any) => {
    const dateStr = candidate.interview?.date 
      ? new Date(candidate.interview.date).toLocaleDateString() 
      : 'TBD';
      
    return template
      .replace(/\{\{candidate_name\}\}/g, candidate.name || '')
      .replace(/\{\{position\}\}/g, candidate.position || '')
      .replace(/\{\{interview_date\}\}/g, dateStr)
      .replace(/\{\{interview_time\}\}/g, candidate.interview?.startTime || 'TBD')
      .replace(/\{\{interview_duration\}\}/g, candidate.interview?.durationMinutes || '30');
  };

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

  if (!mounted) return null;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-neutral-700">
        <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200">
          <tr>
            <th className="px-6 py-4">Candidate</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Position</th>
            <th className="px-6 py-4">Schedule</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="font-medium text-neutral-900">{c.name}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">ID: {c.id.split('-')[0]}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-neutral-700 font-medium">{c.phone}</div>
                <div className="text-neutral-500 text-xs">{c.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                  {c.position}
                </span>
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
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  c.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}>
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  
                  {/* Copy Email Button */}
                  <button 
                    onClick={() => handleCopy(c, 'email')}
                    className="p-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    title="Copy Email Template"
                  >
                    {copiedId === c.id && copiedType === 'email' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>

                  {/* Copy SMS Button */}
                  <button 
                    onClick={() => handleCopy(c, 'sms')}
                    className="p-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    title="Copy SMS Template"
                  >
                    {copiedId === c.id && copiedType === 'sms' ? <Check size={16} className="text-emerald-600" /> : <MessageSquare size={16} />}
                  </button>

                  {/* Open in Email App Button */}
                  <button 
                    onClick={() => handleMailTo(c)}
                    className="p-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    title="Open in Email App"
                  >
                    <Mail size={16} />
                  </button>
                  
                </div>
              </td>
            </tr>
          ))}
          
          {candidates.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center text-neutral-500 text-sm">
                No candidates found. Import a spreadsheet or add one manually to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}