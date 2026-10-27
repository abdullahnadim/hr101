'use client';
import { useState, useEffect } from 'react';
import { Save, Loader2, Calculator, CalendarDays, Clock, CheckSquare, Square, FileText, Percent } from 'lucide-react';

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PayrollSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    basicPercentage: 50,
    houseRentPercentageOfBasic: 50,
    medicalAllowanceFixed: 600,
    salaryCycleStartDay: 26,
    salaryCycleEndDay: 25,
    weekends: ["Friday", "Saturday"],
    taxFreeAmountMale: 400000,
    taxFreeAmountFemale: 450000,
    minimumTaxDhaka: 5000,
    minimumTaxOther: 3000,
    investmentRebatePercentage: 15,
    allowableInvestmentCap: 20
  });

  useEffect(() => {
    fetch('/api/settings/payroll')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          // Safely merge DB data with our default state to prevent uncontrolled inputs
          setSettings(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null && v !== undefined))
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleWeekend = (day: string) => {
    setSettings(prev => ({
      ...prev,
      weekends: prev.weekends.includes(day)
        ? prev.weekends.filter(d => d !== day)
        : [...prev.weekends, day]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        alert('Global payroll configurations updated successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (error) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-neutral-400 mb-2" size={32} />
        <p className="text-neutral-500 text-sm font-medium">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 pb-24">
      
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Payroll & Rules</h1>
        <p className="text-neutral-500 mt-1">Configure global salary breakdown formulas, tax rules, and monthly cycle dates.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Salary Breakdown Block */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
            <Calculator size={18} className="text-emerald-600" />
            <h2 className="font-bold text-neutral-900">Salary Breakdown Formula</h2>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <p className="text-sm text-neutral-500">The "Others" allowance is automatically calculated as the remaining amount after Basic, House Rent, and Medical are deducted from the Gross Base Salary.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Basic Salary % (of Gross)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01" required
                    value={settings.basicPercentage} 
                    onChange={e => setSettings({...settings, basicPercentage: Number(e.target.value)})}
                    className="w-full p-3 pr-10 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                  <span className="absolute right-4 top-3 text-neutral-400 font-bold">%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">House Rent % (of Basic)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01" required
                    value={settings.houseRentPercentageOfBasic} 
                    onChange={e => setSettings({...settings, houseRentPercentageOfBasic: Number(e.target.value)})}
                    className="w-full p-3 pr-10 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                  <span className="absolute right-4 top-3 text-neutral-400 font-bold">%</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Fixed Medical Allowance (৳)</label>
                <div className="relative md:w-1/2">
                  <input 
                    type="number" step="0.01" required
                    value={settings.medicalAllowanceFixed} 
                    onChange={e => setSettings({...settings, medicalAllowanceFixed: Number(e.target.value)})}
                    className="w-full p-3 pl-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                  <span className="absolute left-3 top-3 text-neutral-400 font-bold">৳</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Tax Rules Block */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
            <FileText size={18} className="text-red-600" />
            <h2 className="font-bold text-neutral-900">Annual Tax & Investment Rules (FY 2026-27)</h2>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Tax-Free Limit (Men)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-neutral-400 font-bold">৳</span>
                  <input 
                    type="number" required
                    value={settings.taxFreeAmountMale} 
                    onChange={e => setSettings({...settings, taxFreeAmountMale: Number(e.target.value)})}
                    className="w-full p-3 pl-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Tax-Free Limit (Women/65+)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-neutral-400 font-bold">৳</span>
                  <input 
                    type="number" required
                    value={settings.taxFreeAmountFemale} 
                    onChange={e => setSettings({...settings, taxFreeAmountFemale: Number(e.target.value)})}
                    className="w-full p-3 pl-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Minimum Tax (Dhaka)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-neutral-400 font-bold">৳</span>
                  <input 
                    type="number" required
                    value={settings.minimumTaxDhaka} 
                    onChange={e => setSettings({...settings, minimumTaxDhaka: Number(e.target.value)})}
                    className="w-full p-3 pl-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Max Investment Rebate %</label>
                <div className="flex gap-2">
                  <div className="relative w-full">
                    <input 
                      type="number" required
                      value={settings.allowableInvestmentCap} 
                      onChange={e => setSettings({...settings, allowableInvestmentCap: Number(e.target.value)})}
                      className="w-full p-3 pr-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                      title="Max allowable investment as % of taxable income"
                    />
                    <span className="absolute right-3 top-3 text-neutral-400 font-bold">%</span>
                  </div>
                  <div className="flex items-center text-neutral-400 font-black px-2">X</div>
                  <div className="relative w-full">
                    <input 
                      type="number" required
                      value={settings.investmentRebatePercentage} 
                      onChange={e => setSettings({...settings, investmentRebatePercentage: Number(e.target.value)})}
                      className="w-full p-3 pr-8 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                      title="Rebate percentage on invested amount"
                    />
                    <span className="absolute right-3 top-3 text-neutral-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Salary Cycle Block */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
            <CalendarDays size={18} className="text-blue-600" />
            <h2 className="font-bold text-neutral-900">Attendance & Salary Cycle</h2>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Cycle Start Day</label>
                <input 
                  type="number" min="1" max="31" required
                  value={settings.salaryCycleStartDay} 
                  onChange={e => setSettings({...settings, salaryCycleStartDay: Number(e.target.value)})}
                  className="w-full p-3 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  placeholder="e.g. 26"
                />
                <p className="text-[10px] text-neutral-400 mt-1.5 uppercase font-medium tracking-wide">Day of previous month</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Cycle End Day</label>
                <input 
                  type="number" min="1" max="31" required
                  value={settings.salaryCycleEndDay} 
                  onChange={e => setSettings({...settings, salaryCycleEndDay: Number(e.target.value)})}
                  className="w-full p-3 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:border-black transition-colors" 
                  placeholder="e.g. 25"
                />
                <p className="text-[10px] text-neutral-400 mt-1.5 uppercase font-medium tracking-wide">Day of current month</p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={14} className="text-neutral-400"/> Define Official Weekends
              </label>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map(day => {
                  const isSelected = settings.weekends.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekend(day)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        isSelected 
                        ? 'bg-black text-white border-black shadow-sm' 
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {isSelected ? <CheckSquare size={16} className="text-white" /> : <Square size={16} className="text-neutral-300" />}
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-3">Selected days will be automatically omitted from standard working days when generating payroll.</p>
            </div>

          </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            Save Global Settings
          </button>
        </div>

      </form>
    </div>
  );
}