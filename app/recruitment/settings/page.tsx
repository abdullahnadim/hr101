'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Save, Plus, X, Briefcase, FormInput, Check, Loader2, 
  Mail, MessageSquare, Building2, MessageCircle, Settings2, Info, Users, Clock, Trash2 // <-- Added Trash2 here
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

type TemplateTab = 'whatsapp' | 'email' | 'sms';

export default function RecruitmentSettingsPage() {
  const [mounted, setMounted] = useState(false);
  
  // Basic Settings States
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newEmploymentType, setNewEmploymentType] = useState('');
  
  // Custom Field Form States
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  
  // UX States
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateTab>('whatsapp');
  
  // Zustand Store Connection
  const { 
    positions, addPosition, removePosition, 
    departments, addDepartment, removeDepartment,
    employmentTypes, addEmploymentType, removeEmploymentType,
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

  // --- HANDLERS ---
  const handleAddPosition = () => {
    if (newPosition.trim()) { addPosition(newPosition.trim()); setNewPosition(''); }
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) { addDepartment(newDepartment.trim()); setNewDepartment(''); }
  };

  const handleAddEmploymentType = () => {
    if (newEmploymentType.trim() && addEmploymentType) { addEmploymentType(newEmploymentType.trim()); setNewEmploymentType(''); }
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
      if (setWhatsappTemplate) setWhatsappTemplate(localWhatsappTemplate);
      
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
    let currentRef: HTMLTextAreaElement | null = null;
    let currentValue = '';
    let setter: ((value: string) => void) | undefined = undefined;

    if (activeTab === 'whatsapp') { currentRef = whatsappRef.current; currentValue = localWhatsappTemplate; setter = setLocalWhatsappTemplate; }
    else if (activeTab === 'email') { currentRef = emailRef.current; currentValue = localEmailTemplate; setter = setLocalEmailTemplate; }
    else if (activeTab === 'sms') { currentRef = smsRef.current; currentValue = localSmsTemplate; setter = setLocalSmsTemplate; }

    if (currentRef && setter) {
      const start = currentRef.selectionStart;
      const end = currentRef.selectionEnd;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setter(newValue);
      setTimeout(() => {
        currentRef.focus();
        currentRef.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (setter) {
      setter(currentValue + ' ' + variable);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 md:px-10 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg shadow-sm">
            <Settings2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Recruitment Settings</h1>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">Configure your ATS workspace & candidate templates</p>
          </div>
        </div>
        
        <button 
          onClick={handleSaveChanges}
          disabled={isSaving || isSaved}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-md active:scale-95 disabled:pointer-events-none ${
            isSaved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-black text-white hover:bg-neutral-800 shadow-black/10'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving Workspace...' : isSaved ? 'Saved Successfully' : 'Save Changes'}
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Core Configurations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Positions */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50 rounded-t-2xl">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100"><Briefcase size={16} /></div>
              <h2 className="font-semibold text-neutral-900 text-sm">Job Positions</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex mb-4">
                <input 
                  type="text" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                  placeholder="e.g. UX Designer" className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-l-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleAddPosition} disabled={!newPosition.trim()} className="px-3 py-2 bg-neutral-100 border-y border-r border-neutral-200 text-neutral-700 rounded-r-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"><Plus size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {positions?.map(pos => (
                  <span key={pos} className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 shadow-sm transition-all">
                    {pos}
                    <button onClick={() => removePosition(pos)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Departments */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50 rounded-t-2xl">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100"><Building2 size={16} /></div>
              <h2 className="font-semibold text-neutral-900 text-sm">Departments</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex mb-4">
                <input 
                  type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                  placeholder="e.g. Engineering" className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-l-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button onClick={handleAddDepartment} disabled={!newDepartment.trim()} className="px-3 py-2 bg-neutral-100 border-y border-r border-neutral-200 text-neutral-700 rounded-r-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"><Plus size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments?.map(dept => (
                  <span key={dept} className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 shadow-sm transition-all">
                    {dept}
                    <button onClick={() => removeDepartment(dept)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Employment Types */}
          <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col hover:border-neutral-300 transition-colors">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50 rounded-t-2xl">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100"><Clock size={16} /></div>
              <h2 className="font-semibold text-neutral-900 text-sm">Employment Types</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex mb-4">
                <input 
                  type="text" value={newEmploymentType} onChange={(e) => setNewEmploymentType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEmploymentType()}
                  placeholder="e.g. Part-Time, Contract" className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-l-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <button onClick={handleAddEmploymentType} disabled={!newEmploymentType.trim()} className="px-3 py-2 bg-neutral-100 border-y border-r border-neutral-200 text-neutral-700 rounded-r-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"><Plus size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {employmentTypes?.map(type => (
                  <span key={type} className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 shadow-sm transition-all">
                    {type}
                    <button onClick={() => removeEmploymentType && removeEmploymentType(type)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Dynamic Candidate Fields Form Builder */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 transition-colors">
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100"><FormInput size={18} /></div>
            <div>
              <h2 className="font-semibold text-neutral-900">Custom Candidate Form Builder</h2>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">These fields will appear instantly when adding or editing a candidate.</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add Field Tool */}
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4 h-fit">
              <input 
                type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Field Label (e.g. Expected Salary)" 
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm font-medium shadow-sm"
              />
              
              <div className="flex gap-2">
                <select 
                  value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm font-medium bg-white shadow-sm"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number Input</option>
                  <option value="date">Date Input</option>
                  <option value="url">URL Link</option>
                  <option value="select">Dropdown Select</option>
                </select>
                
                <label className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-700 bg-white px-3 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors select-none shadow-sm">
                  <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded text-black focus:ring-black w-4 h-4" />
                  Required
                </label>
              </div>

              {newFieldType === 'select' && (
                <input 
                  type="text" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)}
                  placeholder="Options (comma separated: Yes, No, Maybe)" 
                  className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm placeholder:text-emerald-700/50 shadow-sm"
                />
              )}
              
              <button onClick={handleAddField} disabled={!newFieldLabel} className="w-full py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md">
                <Plus size={16} /> Add Custom Field
              </button>
            </div>

            {/* Live Field List */}
            <div className="space-y-3">
              {customFields?.map((field: any) => (
                <div key={field.id} className="group flex justify-between items-center px-4 py-3 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-black/20 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 text-sm">{field.label}</span>
                      {field.required && <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-1.5 rounded">Required</span>}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mt-1">
                      Type: {field.type} {field.type === 'select' && <span className="text-emerald-600">({field.options?.length} opts: {field.options?.join(', ')})</span>}
                    </div>
                  </div>
                  <button onClick={() => removeField(field.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
              {customFields?.length === 0 && (
                <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-sm text-neutral-400 font-medium border-2 border-dashed border-neutral-200 rounded-xl bg-white p-6 text-center">
                  <FormInput size={32} className="text-neutral-300 mb-3" />
                  No custom fields configured.<br/>Add fields like "Notice Period" or "Expected Salary".
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- TABBED MESSAGING TEMPLATES --- */}
        <section className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Communication Templates</h2>
              <p className="text-sm text-neutral-500 mt-0.5 font-medium">Standardize the automated messages sent to candidates</p>
            </div>
            
            {/* Interactive Variable Cheat Sheet */}
            <div className="bg-white border border-neutral-200 p-2.5 rounded-xl shadow-sm w-full xl:w-fit">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Info size={14} className="text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Click to Insert Variables:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableVariables.map((v) => (
                  <button 
                    key={v.key} onClick={() => handleInsertVariable(v.key)}
                    className="px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-[11px] font-mono font-semibold text-neutral-700 hover:bg-black hover:text-white hover:border-black transition-colors active:scale-95"
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
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <Mail size={16} /> Email
              </button>
              <button 
                onClick={() => setActiveTab('sms')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'sms' ? 'bg-white text-purple-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <MessageSquare size={16} /> SMS
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 shadow-inner">
              {activeTab === 'whatsapp' && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wider">WhatsApp Message Format</label>
                  <textarea 
                    ref={whatsappRef} rows={6}
                    className="w-full px-4 py-3 border border-emerald-200 bg-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y font-medium"
                    value={localWhatsappTemplate} onChange={(e) => setLocalWhatsappTemplate(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'email' && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">Standard Email Format</label>
                  <textarea 
                    ref={emailRef} rows={10}
                    className="w-full px-4 py-3 border border-blue-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y font-medium"
                    value={localEmailTemplate} onChange={(e) => setLocalEmailTemplate(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'sms' && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">SMS / Text Message Format</label>
                  <textarea 
                    ref={smsRef} rows={4}
                    className="w-full px-4 py-3 border border-purple-200 bg-white rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm leading-relaxed text-neutral-800 shadow-sm resize-y font-medium"
                    value={localSmsTemplate} onChange={(e) => setLocalSmsTemplate(e.target.value)}
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