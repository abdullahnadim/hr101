'use client';
import { useState } from 'react';
import { Check, Copy, Mail, MessageSquare, Calendar } from 'lucide-react';

export default function CandidateTable({ candidates }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMessage = async (candidate: any) => {
    // Generate the personalized message locally before copying
    const message = `Dear ${candidate.name},\n\nYou have been selected for an interview for the ${candidate.position} position.\n\nDate: ${candidate.interview?.date}\nTime: ${candidate.interview?.startTime}\n\nPlease confirm your availability.\n\nRegards,\nHR Department`;
    
    await navigator.clipboard.writeText(message);
    setCopiedId(candidate.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-gray-700">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-6 py-4">Candidate</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Position</th>
            <th className="px-6 py-4">Schedule</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-500">ID: {c.id.split('-')[0]}</div>
              </td>
              <td className="px-6 py-4">
                <div>{c.phone}</div>
                <div className="text-gray-500">{c.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {c.position}
                </span>
              </td>
              <td className="px-6 py-4">
                {c.interview ? (
                  <div>
                    <div className="font-medium text-gray-900">{c.interview.startTime}</div>
                    <div className="text-xs text-gray-500">{new Date(c.interview.date).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Not scheduled</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  c.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => handleCopyMessage(c)}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Copy Personalized Message"
                  >
                    {copiedId === c.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                  <button className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all" title="Send Email">
                    <Mail size={16} />
                  </button>
                  <button className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all" title="Send SMS">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          
          {candidates.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No candidates found. Import a spreadsheet to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}