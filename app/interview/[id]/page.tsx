'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Briefcase, Mail, Phone, Loader2, CheckCircle2, DollarSign, CalendarClock, Star } from 'lucide-react';

export default function InterviewScorecard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scores & Details state
  const [scoreTech, setScoreTech] = useState(0);
  const [scoreComm, setScoreComm] = useState(0);
  const [scoreCulture, setScoreCulture] = useState(0);
  const [generalScore, setGeneralScore] = useState(0); // NEW
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [evalNotes, setEvalNotes] = useState('');

  useEffect(() => {
    const fetchCandidate = async () => {
      const res = await fetch(`/api/candidates`);
      const data = await res.json();
      const current = data.find((c: any) => c.id === id); 
      
      if (current) {
        setCandidate(current);
        setScoreTech(current.scoreTech || 0);
        setScoreComm(current.scoreComm || 0);
        setScoreCulture(current.scoreCulture || 0);
        setGeneralScore(current.generalScore || 0);
        setExpectedSalary(current.expectedSalary || '');
        setNoticePeriod(current.noticePeriod || '');
        setEvalNotes(current.evalNotes || '');
      }
      setLoading(false);
    };
    fetchCandidate();
  }, [id]);

  const handleSave = async (finish: boolean) => {
    setSaving(true);
    await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scoreTech,
        scoreComm,
        scoreCulture,
        generalScore,
        expectedSalary,
        noticePeriod,
        evalNotes,
        status: finish ? 'INTERVIEWED' : candidate.status 
      })
    });
    setSaving(false);
    if (finish) router.push('/');
  };

  // --- RENDERING HELPERS ---

  const renderStars = (score: number, setScore: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            onClick={() => setScore(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star size={24} className={star <= score ? "fill-amber-400 text-amber-400" : "text-neutral-200"} />
          </button>
        ))}
      </div>
    );
  };

  const renderMarks = (score: number, setScore: (val: number) => void) => {
    return (
      <div className="flex gap-1 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
          <button 
            key={mark} 
            onClick={() => setScore(mark)}
            className={`w-10 h-10 rounded-md text-sm font-semibold transition-all focus:outline-none ${
              mark <= score 
                ? 'bg-black text-white shadow-sm' 
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            {mark}
          </button>
        ))}
      </div>
    );
  };

  const renderImportNotes = (notes: string) => {
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed)) {
        return (
          <div className="space-y-1.5 mt-2">
            {parsed.map((n, i) => (
              <div key={i} className="flex justify-between items-center bg-white border border-neutral-100 px-3 py-2 rounded-md text-sm shadow-sm">
                <span className="font-semibold text-neutral-500">{n.key}</span>
                <span className="text-neutral-900 font-medium">{n.value}</span>
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // If it fails to parse (meaning it's just regular text), fallback to raw string
    }
    return <p className="text-sm text-neutral-600 whitespace-pre-wrap mt-2">{notes}</p>;
  };

  // --- UI RENDER ---

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>;
  if (!candidate) return <div className="p-8">Candidate not found.</div>;

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSave(false)} className="px-4 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Draft
            </button>
            <button onClick={() => handleSave(true)} className="px-5 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-md">
              <CheckCircle2 size={16} /> Complete Interview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Panel: Candidate Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{candidate.name}</h1>
                <p className="text-sm text-neutral-500 font-medium">{candidate.position}</p>
              </div>
            </div>

            <hr className="border-neutral-100" />

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-neutral-600"><Briefcase size={16} className="text-neutral-400" /> {candidate.department || 'No Department'}</div>
              <div className="flex items-center gap-3 text-neutral-600"><Mail size={16} className="text-neutral-400" /> {candidate.email}</div>
              <div className="flex items-center gap-3 text-neutral-600"><Phone size={16} className="text-neutral-400" /> {candidate.phone}</div>
            </div>

            {candidate.notes && (
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Import Notes</h3>
                {renderImportNotes(candidate.notes)}
              </div>
            )}
          </div>

          {/* Right Panel: The Scorecard */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-8">
            
            {/* Logistics Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign size={14} /> Expected Salary
                </label>
                <input 
                  type="text" 
                  value={expectedSalary} 
                  onChange={(e) => setExpectedSalary(e.target.value)} 
                  placeholder="e.g., 40,000 - 50,000 BDT" 
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarClock size={14} /> Notice Period
                </label>
                <input 
                  type="text" 
                  value={noticePeriod} 
                  onChange={(e) => setNoticePeriod(e.target.value)} 
                  placeholder="e.g., Immediate, 1 Month, etc." 
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* General Score (1-10) */}
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">General Score</h2>
              {renderMarks(generalScore, setGeneralScore)}
            </div>

            {/* Specific Criteria (5 Stars) */}
            <div>
              <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4">Criteria Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">Technical Skills</label>
                  {renderStars(scoreTech, setScoreTech)}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">Communication</label>
                  {renderStars(scoreComm, setScoreComm)}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">Culture Fit</label>
                  {renderStars(scoreCulture, setScoreCulture)}
                </div>

              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Remarks / Notes */}
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-neutral-700 mb-3 flex justify-between items-end">
                Remarks
                <span className="text-xs font-normal text-neutral-400">Auto-expands as you type</span>
              </label>
              <textarea 
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                placeholder="Add your remarks here... Strengths? Weaknesses? Final thoughts?"
                className="w-full flex-1 min-h-[200px] p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black focus:outline-none resize-y transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}