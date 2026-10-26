'use client';
import { useState, useEffect } from 'react';
import { Save, Check, Loader2, Building, Clock, Globe, Bell } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function GeneralSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Zustand Store
  const { 
    companyName, setCompanyName,
    timezone, setTimezone,
    workDayStart, setWorkDayStart,
    workDayEnd, setWorkDayEnd
  } = useSettingsStore();

  // Local state for forms
  const [localCompany, setLocalCompany] = useState('');
  const [localTz, setLocalTz] = useState('');
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');

  useEffect(() => {
    setMounted(true);
    setLocalCompany(companyName || '');
    setLocalTz(timezone || 'Asia/Dhaka');
    setLocalStart(workDayStart || '09:00');
    setLocalEnd(workDayEnd || '18:00');
  }, [companyName, timezone, workDayStart, workDayEnd]);

  if (!mounted) return null;

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setCompanyName(localCompany);
      setTimezone(localTz);
      setWorkDayStart(localStart);
      setWorkDayEnd(localEnd);
      
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 400);
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">General Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage global platform configurations and working hours.</p>
        </div>
        
        <button 
          onClick={handleSaveChanges}
          disabled={isSaving || isSaved}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-80 ${
            isSaved ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Company Profile */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
            <Building size={18} className="text-neutral-500" />
            <div>
              <h2 className="font-semibold text-neutral-800">Company Profile</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Core organizational details.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="max-w-md">
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Company Name</label>
              <input 
                type="text" 
                value={localCompany} 
                onChange={(e) => setLocalCompany(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
          </div>
        </section>

        {/* Business Hours & Region */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
            <Clock size={18} className="text-neutral-500" />
            <div>
              <h2 className="font-semibold text-neutral-800">Business Hours & Region</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Sets the default boundaries for scheduling and calendars.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5 flex items-center gap-1.5"><Globe size={14}/> Timezone</label>
              <select 
                value={localTz} 
                onChange={(e) => setLocalTz(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (BDT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Work Day Start</label>
                <input 
                  type="time" 
                  value={localStart} 
                  onChange={(e) => setLocalStart(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Work Day End</label>
                <input 
                  type="time" 
                  value={localEnd} 
                  onChange={(e) => setLocalEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}