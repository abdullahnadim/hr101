'use client';
import { useState, useEffect } from 'react';
import { Save, Plus, X, Briefcase, FormInput, Check, Loader2, Mail, MessageSquare, Building2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  
  // Button UX states
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Zustand Store
  const { 
    positions, addPosition, removePosition, 
    departments, addDepartment, removeDepartment,
    customFields, addField, removeField,
    emailTemplate, setEmailTemplate,
    smsTemplate, setSmsTemplate
  } = useSettingsStore();

  // Local states for template editing
  const [localEmailTemplate, setLocalEmailTemplate] = useState('');
  const [localSmsTemplate, setLocalSmsTemplate] = useState('');

  // Hydration fix & load saved templates
  useEffect(() => {
    setMounted(true);
    setLocalEmailTemplate(emailTemplate);
    setLocalSmsTemplate(smsTemplate);
  }, [emailTemplate, smsTemplate]);

  if (!mounted) return null;

  const handleAddPosition = () => {
    if (newPosition.trim()) {
      addPosition(newPosition.trim());
      setNewPosition('');
    }
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      addDepartment(newDepartment.trim());
      setNewDepartment('');
    }
  };

  const handleAddField = () => {
    if (newFieldLabel.trim()) {
      addField({
        id: newFieldLabel.toLowerCase().replace(/\s+/g, '-'),
        label: newFieldLabel.trim(),
        type: 'text'
      });
      setNewFieldLabel('');
    }
  };

  // Functional Save Action
  const handleSaveChanges = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      setEmailTemplate(localEmailTemplate);
      setSmsTemplate(localSmsTemplate);
      setIsSaving(false);
      setIsSaved(true);
      
      setTimeout(() => setIsSaved(false), 2000);
    }, 400);
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure workspace preferences and templates</p>
        </div>
        
        <button 
          onClick={handleSaveChanges}
          disabled={isSaving || isSaved}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-80 ${
            isSaved 
              ? 'bg-emerald-600 text-white' 
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isSaved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Positions Configuration */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
              <Briefcase size={18} className="text-neutral-500" />
              <div>
                <h2 className="font-semibold text-neutral-800">Job Positions</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Preset auto-suggest roles.</p>
              </div>
            </div>
            <div className="p-6 flex-1">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                  placeholder="Add new position..." 
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
                <button onClick={handleAddPosition} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {positions?.map(pos => (
                  <span key={pos} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                    {pos}
                    <button onClick={() => removePosition(pos)} className="text-neutral-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Departments Configuration */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
              <Building2 size={18} className="text-neutral-500" />
              <div>
                <h2 className="font-semibold text-neutral-800">Departments</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Preset organizational units.</p>
              </div>
            </div>
            <div className="p-6 flex-1">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                  placeholder="Add new department..." 
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
                <button onClick={handleAddDepartment} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments?.map(dept => (
                  <span key={dept} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                    {dept}
                    <button onClick={() => removeDepartment(dept)} className="text-neutral-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Custom Candidate Fields */}
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
              <FormInput size={18} className="text-neutral-500" />
              <div>
                <h2 className="font-semibold text-neutral-800">Candidate Fields</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Extra Add Candidate inputs.</p>
              </div>
            </div>
            <div className="p-6 flex-1">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  placeholder="Field label (e.g., LinkedIn URL)" 
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
                <button onClick={handleAddField} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {customFields?.map(field => (
                  <div key={field.id} className="flex justify-between items-center px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
                    <span>{field.label}</span>
                    <button onClick={() => removeField(field.id)} className="text-neutral-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {customFields?.length === 0 && <p className="text-xs text-neutral-400 italic">No extra fields added yet.</p>}
              </div>
            </div>
          </section>
        </div>

        {/* Messaging Templates Section */}
        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <h2 className="font-semibold text-neutral-800">Messaging Templates</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Customize the default templates used when generating interview messages.</p>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Email Template Area */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-2">
                <Mail size={16} className="text-neutral-500" />
                Email Template
              </label>
              <textarea 
                rows={8}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm leading-relaxed text-neutral-800"
                value={localEmailTemplate}
                onChange={(e) => setLocalEmailTemplate(e.target.value)}
              />
            </div>

            <hr className="border-neutral-100" />

            {/* SMS Template Area */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-2">
                <MessageSquare size={16} className="text-neutral-500" />
                SMS Template
              </label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm leading-relaxed text-neutral-800"
                value={localSmsTemplate}
                onChange={(e) => setLocalSmsTemplate(e.target.value)}
              />
            </div>
            
            {/* Variables Cheat Sheet */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Available Variables</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {['{{candidate_name}}', '{{position}}', '{{interview_date}}', '{{interview_time}}', '{{interview_duration}}'].map(variable => (
                  <span key={variable} className="px-2 py-1 bg-white border border-neutral-200 rounded text-neutral-600 font-mono shadow-sm">
                    {variable}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  );
}