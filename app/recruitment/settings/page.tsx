'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Save, Plus, X, Briefcase, FormInput, Check, Loader2, 
  Mail, MessageSquare, Building2, MessageCircle, Settings2, Info 
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

type TemplateTab = 'whatsapp' | 'email' | 'sms';

export default function RecruitmentSettingsPage() {
  const [mounted, setMounted] = useState(false);
  
  // Basic Settings States
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  
  // Custom Field Form States
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  
  // UX States
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateTab>('whatsapp');
  
  // Zustand Store
  const { 
    positions, addPosition, removePosition, 
    departments, addDepartment, removeDepartment,
    customFields, addField, removeField,
    emailTemplate, setEmailTemplate,
    smsTemplate, setSmsTemplate,
    whatsappTemplate, setWhatsappTemplate
  } = useSettingsStore();

  const [localEmailTemplate, setLocalEmailTemplate] = useState('');
  const [localSmsTemplate, setLocalSmsTemplate] = useState('');
  const [localWhatsappTemplate, setLocalWhatsappTemplate] = useState('');

  // Refs for textareas to insert variables at cursor position
  const whatsappRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLTextAreaElement>(null);
  const smsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    setLocalEmailTemplate(emailTemplate || '');
    setLocalSmsTemplate(smsTemplate || '');
    setLocalWhatsappTemplate(whatsappTemplate || '');
  }, [emailTemplate, smsTemplate, whatsappTemplate]);

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
      const fieldId = newFieldLabel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const optionsArray = newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : [];
      
      addField({
        id: fieldId,
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: newFieldRequired,
        options: optionsArray
      } as any);
      
      setNewFieldLabel('');
      setNewFieldType('text');
      setNewFieldOptions('');
      setNewFieldRequired(false);
    }
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setEmailTemplate(localEmailTemplate);
      setSmsTemplate(localSmsTemplate);
      
      // FIXED: Use optional chaining to satisfy TypeScript's strict checks
      if (setWhatsappTemplate) {
        setWhatsappTemplate(localWhatsappTemplate);
      }
      
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 600);
  };

  // Available Variables for templates
  const availableVariables = [
    { key: '{{candidate_name}}', label: 'Candidate Name' },
    { key: '{{position}}', label: 'Position' },
    { key: '{{interview_date}}', label: 'Interview Date' },
    { key: '{{interview_time}}', label: 'Interview Time' },
    { key: '{{interview_duration}}', label: 'Duration' },
  ];

  const handleInsertVariable = (variable: string) => {
    let currentRef;
    let currentValue = '';
    let setter;

    if (activeTab === 'whatsapp') { 
      currentRef = whatsappRef.current; 
      currentValue = localWhatsappTemplate; 
      setter = setLocalWhatsappTemplate; 
    }
    else if (activeTab === 'email') { 
      currentRef = emailRef.current; 
      currentValue = localEmailTemplate; 
      setter = setLocalEmailTemplate; 
    }
    else if (activeTab === 'sms') { 
      currentRef = smsRef.current; 
      currentValue = localSmsTemplate; 
      setter = setLocalSmsTemplate; 
    }

    if (currentRef) {
      const start = currentRef.selectionStart;
      const end = currentRef.selectionEnd;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setter(newValue);
      
      // Re-focus and set cursor position after inserting
      setTimeout(() => {
        currentRef.focus();
        currentRef.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      // Fallback if no ref is focused (just append to the end)
      setter(currentValue + ' ' + variable);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Sleek Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 md:px-10 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Settings2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Recruitment Settings</h1>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">Configure your ATS workspace & templates</p>
          </div>
        </div>
        
        <button 
          onClick={handleSaveChanges}
          disabled={isSaving || isSaved}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-md active:scale-95 disabled:pointer-events-none ${
            isSaved 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-black text-white hover:bg-neutral-800 shadow-black/10'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving Workspace...' : isSaved ? 'Saved Successfully' : 'Save Changes'}
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Core Configurations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Positions */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3 bg-gradient-to-b from-white to-neutral-50/50">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={18} /></div>
              <div>
                <h2 className="font-semibold text-neutral-900">Job Positions</h2>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">Auto-Suggest Roles</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex bg-neutral-50 border border-neutral-200 rounded-lg p-1 mb-5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <input 
                  type="text" value={newPosition} onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                  placeholder="e.g. UX Designer..." 
                  className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm font-medium placeholder:font-normal"
                />
                <button onClick={handleAddPosition} disabled={!newPosition.trim()} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50 shadow-sm"><Plus size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {positions?.map(pos => (
                  <span key={pos} className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 shadow-sm hover:border-neutral-300 hover:shadow transition-all">
                    {pos}
                    <button onClick={() => removePosition(pos)} className="text-neutral-400 hover:text-red-500 bg-neutral-50 group-hover:bg-red-50 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Departments */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3 bg-gradient-to-b from-white to-neutral-50/50">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 size={18} /></div>
              <div>
                <h2 className="font-semibold text-neutral-900">Departments</h2>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">Org Units</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex bg-neutral-50 border border-neutral-200 rounded-lg p-1 mb-5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <input 
                  type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                  placeholder="e.g. Engineering..." 
                  className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm font-medium placeholder:font-normal"
                />
                <button onClick={handleAddDepartment} disabled={!newDepartment.trim()} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50 shadow-sm"><Plus size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {departments?.map(dept => (
                  <span key={dept} className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 shadow-sm hover:border-neutral-300 hover:shadow transition-all">
                    {dept}
                    <button onClick={() => removeDepartment(dept)} className="text-neutral-400 hover:text-red-500 bg-neutral-50 group-hover:bg-red-50 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Dynamic Candidate Fields */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3 bg-gradient-to-b from-white to-neutral-50/50">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FormInput size={18} /></div>
              <div>
                <h2 className="font-semibold text-neutral-900">Form Builder</h2>
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">Candidate Custom Fields</p>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-5">
              {/* Add Field Tool */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <input 
                  type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Field label (e.g. LinkedIn URL)" 
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm font-medium"
                />
                
                <div className="flex gap-2">
                  <select 
                    value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm font-medium bg-white"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="date">Date Input</option>
                    <option value="url">URL Link</option>
                    <option value="select">Dropdown</option>
                  </select>
                  
                  <label className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-700 bg-white px-3 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors select-none">
                    <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded text-black focus:ring-black w-4 h-4" />
                    Required
                  </label>
                </div>

                {newFieldType === 'select' && (
                  <input 
                    type="text" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Options (comma separated: S, M, L, XL)" 
                    className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50/50 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm placeholder:text-emerald-700/50"
                  />
                )}
                
                <button onClick={handleAddField} disabled={!newFieldLabel} className="w-full py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-black shadow-md">
                  <Plus size={16} /> Add Field
                </button>
              </div>

              {/* Field List */}
              <div className="space-y-2.5">
                {customFields?.map((field: any) => (
                  <div key={field.id} className="group flex justify-between items-center px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm hover:border-neutral-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{field.label}</span>
                        {field.required && <span className="text-red-500 font-bold" title="Required">*</span>}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mt-0.5">
                        Type: {field.type} {field.type === 'select' && `(${field.options?.length} opts)`}
                      </div>
                    </div>
                    <button onClick={() => removeField(field.id)} className="text-neutral-300 hover:text-red-500 transition-colors"><X size={18} /></button>
                  </div>
                ))}
                {customFields?.length === 0 && (
                  <div className="text-center py-6 text-sm text-neutral-400 font-medium border border-dashed border-neutral-200 rounded-xl bg-white">
                    No custom fields configured
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* --- TABBED MESSAGING TEMPLATES --- */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Communication Templates</h2>
              <p className="text-sm text-neutral-500 mt-1 font-medium">Standardize the messages sent to candidates</p>
            </div>
            
            {/* Interactive Variable Cheat Sheet */}
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl max-w-md w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={14} className="text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Click to Insert Variables:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableVariables.map((v) => (
                  <button 
                    key={v.key}
                    onClick={() => handleInsertVariable(v.key)}
                    className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono text-neutral-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm active:scale-95"
                    title={`Insert ${v.label}`}
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Template Tabs */}
            <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl mb-6 w-full md:w-fit">
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <Mail size={16} /> Email
              </button>
              <button 
                onClick={() => setActiveTab('sms')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sms' ? 'bg-white text-purple-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <MessageSquare size={16} /> SMS
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
              {activeTab === 'whatsapp' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-bold text-emerald-700 mb-3 uppercase tracking-wider">WhatsApp Message Format</label>
                  <textarea 
                    ref={whatsappRef}
                    rows={5}
                    className="w-full px-4 py-3 border border-emerald-200 bg-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y"
                    value={localWhatsappTemplate}
                    onChange={(e) => setLocalWhatsappTemplate(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'email' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-bold text-blue-700 mb-3 uppercase tracking-wider">Standard Email Format</label>
                  <textarea 
                    ref={emailRef}
                    rows={8}
                    className="w-full px-4 py-3 border border-blue-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y"
                    value={localEmailTemplate}
                    onChange={(e) => setLocalEmailTemplate(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'sms' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-bold text-purple-700 mb-3 uppercase tracking-wider">SMS / Text Message Format</label>
                  <textarea 
                    ref={smsRef}
                    rows={4}
                    className="w-full px-4 py-3 border border-purple-200 bg-white rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y"
                    value={localSmsTemplate}
                    onChange={(e) => setLocalSmsTemplate(e.target.value)}
                  />
                </div>
              )}
            </div>
            
          </div>
        </section>
        
      </div>
    </div>
  );
}