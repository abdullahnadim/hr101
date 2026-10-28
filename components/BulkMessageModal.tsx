'use client';
import { useState } from 'react';
import { X, Loader2, Send, Mail, MessageSquare, Phone } from 'lucide-react';

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidateIds: string[];
  onSuccess: () => void;
}

export default function BulkMessageModal({ isOpen, onClose, selectedCandidateIds, onSuccess }: BulkMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(['EMAIL']);

  if (!isOpen) return null;

  const toggleChannel = (channel: string) => {
    setChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channels.length === 0) return alert("Please select at least one delivery channel.");
    
    setLoading(true);
    try {
      const res = await fetch('/api/candidates/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedCandidateIds, message, channels })
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
        setMessage('');
      } else {
        alert("Failed to send messages.");
      }
    } catch (err) {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="font-bold text-neutral-900">Broadcast Message</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Sending to {selectedCandidateIds.length} selected candidates.</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Delivery Channels</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => toggleChannel('EMAIL')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${channels.includes('EMAIL') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                <Mail size={20} /> <span className="text-[10px] font-bold uppercase">Email</span>
              </button>
              <button type="button" onClick={() => toggleChannel('SMS')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${channels.includes('SMS') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                <MessageSquare size={20} /> <span className="text-[10px] font-bold uppercase">SMS</span>
              </button>
              <button type="button" onClick={() => toggleChannel('WHATSAPP')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${channels.includes('WHATSAPP') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                <Phone size={20} /> <span className="text-[10px] font-bold uppercase">WhatsApp</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Message Content</label>
              <span className="text-[10px] text-neutral-400">Use {'{{name}}'} to personalize</span>
            </div>
            <textarea 
              required
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hi {{name}}, we would like to invite you to the next stage of the interview process..."
              className="w-full p-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-black resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Dispatch Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}