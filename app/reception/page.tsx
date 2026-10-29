'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Receipt, Users, AlertCircle, ArrowRight, Clock, Loader2 } from 'lucide-react';

export default function ReceptionHub() {
  const [stats, setStats] = useState({
    enteredToday: 0,
    sentToAccounts: 0,
    discrepancies: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reception/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard statistics", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Front Desk Operations</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage incoming bills, track approval statuses, and handle visitors.</p>
      </header>

      {/* Dynamic Dashboard Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Receipt size={20}/></div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Entered Today</p>
            {loadingStats ? <Loader2 size={16} className="animate-spin text-neutral-300 mt-1" /> : (
              <p className="text-2xl font-black text-neutral-900">{stats.enteredToday}</p>
            )}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><Clock size={20}/></div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">In Accounts Queue</p>
            {loadingStats ? <Loader2 size={16} className="animate-spin text-neutral-300 mt-1" /> : (
              <p className="text-2xl font-black text-neutral-900">{stats.sentToAccounts}</p>
            )}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><AlertCircle size={20}/></div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Discrepancies</p>
            {loadingStats ? <Loader2 size={16} className="animate-spin text-neutral-300 mt-1" /> : (
              <p className="text-2xl font-black text-neutral-900">{stats.discrepancies}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Module: Bills */}
        <Link href="/reception/bill" className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col items-start gap-4 cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500">
            <Receipt size={100} />
          </div>
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
            <Receipt size={24} />
          </div>
          <div className="relative z-10 w-full">
            <h2 className="font-bold text-neutral-900 text-lg">Financial Bill Entry</h2>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">Log physical invoices and forward to Accounts & Audit.</p>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-blue-600 group-hover:gap-3 transition-all">
              Open Logbook <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Future Module Placeholders */}
        <div className="bg-neutral-50 border border-neutral-200/60 p-6 rounded-2xl flex flex-col items-start gap-4 opacity-60 grayscale cursor-not-allowed">
          <div className="w-12 h-12 bg-neutral-200 text-neutral-500 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-bold text-neutral-700">Visitor Log</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}