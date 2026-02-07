'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  'https://kpbtfrtlqjpgbtjrjaey.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYnRmcnRscWpwZ2J0anJqYWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk1NjEsImV4cCI6MjA4NjA0NTU2MX0.hUPi2UHd6-YZhPvGeXKinS7zQEH63n5bgTjmc2tgoP8'
);

export default function SuperBowlSquares({
  searchParams,
}: {
  searchParams: { admin?: string };
}) {
  const [squares, setSquares] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = searchParams.admin === '2791';

  const getWinningSquareId = (patsScore: number | null, hawksScore: number | null) => {
    // If scores aren't entered OR settings hasn't loaded arrays yet, bail out
  if (patsScore === null || hawksScore === null || !settings?.away_numbers || !settings?.home_numbers) {
    return null;
  }
    
    const patsDigit = patsScore % 10;
    const hawksDigit = hawksScore % 10;
  
    // Find which index in the randomized arrays matches these digits
    const colIndex = settings.away_numbers.indexOf(patsDigit);
    const rowIndex = settings.home_numbers.indexOf(hawksDigit);
  
    if (colIndex === -1 || rowIndex === -1) return null;
    return rowIndex * 10 + colIndex;
  };
  
// Calculate all winners - only if settings is loaded
const winners = settings ? {
  q1: getWinningSquareId(settings.q1_pats, settings.q1_hawks),
  q2: getWinningSquareId(settings.q2_pats, settings.q2_hawks),
  q3: getWinningSquareId(settings.q3_pats, settings.q3_hawks),
  final: getWinningSquareId(settings.final_pats, settings.final_hawks),
} : { q1: null, q2: null, q3: null, final: null };

const winningIds = Object.values(winners).filter(id => id !== null);
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squares' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { data: squaresData } = await supabase.from('squares').select('*').order('id', { ascending: true });
    const { data: settingsData } = await supabase.from('settings').select('*').single();
    setSquares(squaresData || []);
    setSettings(settingsData);
    setLoading(false);
  }

  const claimSquare = async (id: number) => {
    const name = window.prompt('Enter your name to claim this square:');
    if (!name || name.trim() === '') return;

    const { data } = await supabase.from('squares').select('owner_name').eq('id', id).single();
    if (data?.owner_name) {
      alert('This square was just taken!');
      return;
    }

    await supabase.from('squares').update({ owner_name: name }).eq('id', id);
  };

  const randomizeNumbers = async () => {
    if (!confirm('This will randomize the numbers and reveal them to everyone. Proceed?')) return;
    const shuffle = () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    await supabase.from('settings').update({
      home_numbers: shuffle(),
      away_numbers: shuffle(),
      numbers_visible: true,
    }).eq('id', 1);
  };

  const resetBoard = async () => {
    if (!confirm('WARNING: This clears ALL names and hides the numbers. Reset?')) return;
    await supabase.from('squares').update({ owner_name: null }).neq('id', -1);
    await supabase.from('settings').update({
      numbers_visible: false,
      home_numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      away_numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    }).eq('id', 1);
  };

  if (loading || !settings)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse font-black text-2xl text-slate-300 uppercase">Loading Board...</div>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-12 text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 drop-shadow-sm">
            Super Bowl LX <span className="text-blue-600">Squares</span>
          </h1>
          <div><span className="text-lg font-bold text-slate-400>">$1/square - Venmo @Todd-McGregor</span>
          <p className="text-sm font-bold text-slate-400>">Payouts: Q1 $15, Q2 $20, Q3 $15, FINAL $50</p>
          </div>
          <div className="mt-4 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-s font-bold text-slate-400 uppercase tracking-widest">Columns ⇅</span>
              <span className="bg-slate-900 text-white px-3 py-1 rounded text-sm font-black uppercase tracking-tighter italic">Pats</span>
            </div>
            <div className="hidden md:block text-slate-300 font-black">X</div>
            <div className="flex items-center gap-2">
              <span className="text-s font-bold text-slate-400 uppercase tracking-widest">Rows ⇄</span>
              <span className="bg-slate-900 text-white px-3 py-1 rounded text-sm font-black uppercase tracking-tighter italic">'Hawks</span>
            </div>
          </div>
        </div>

        {/* MOBILE SCROLL HINT */}
        <div className="block md:hidden text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 animate-pulse">
          ← Swipe to see full board →
        </div>

        {/* THE BOARD WRAPPER (Mobile Responsive) */}
        <div className="relative overflow-x-auto pb-6 custom-scrollbar">
          <div className="inline-grid grid-cols-11 gap-1 border-[6px] border-slate-900 bg-slate-900 shadow-[15px_15px_0px_0px_rgba(0,0,0,0.05)] min-w-[700px] md:min-w-full">
            
            {/* Empty Intersection Square */}
            <div className="aspect-square bg-slate-800 flex items-center justify-center">
                <div className="w-1/2 h-[2px] bg-slate-700 -rotate-45 opacity-50" />
            </div>

            {/* Pats Numbers (Top Row / Columns) */}
            {settings.away_numbers.map((num: number, i: number) => (
              <div key={`col-num-${i}`} className="aspect-square bg-slate-800 text-white flex items-center justify-center font-black text-2xl border-l border-slate-700">
                {settings.numbers_visible ? num : '?'}
              </div>
            ))}

            {/* Grid Content */}
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}>
                {/* 'Hawks Numbers (Left Column / Rows) */}
                <div className="aspect-square bg-slate-800 text-white flex items-center justify-center font-black text-2xl border-t border-slate-700">
                  {settings.numbers_visible ? settings.home_numbers[rowIndex] : '?'}
                </div>
                
                {/* Playable Squares */}
                {squares.slice(rowIndex * 10, rowIndex * 10 + 10).map((square) => {
  const isWinner = winningIds.includes(square.id);
  
  return (
    <button
      key={square.id}
      disabled={!!square.owner_name}
      onClick={() => claimSquare(square.id)}
      className={`aspect-square border border-slate-100 text-[10px] sm:text-xs leading-tight font-black transition-all overflow-hidden p-1 flex items-center justify-center
        ${isWinner 
          ? 'bg-yellow-400 text-slate-900 ring-4 ring-yellow-200 z-20 scale-110 shadow-lg' 
          : square.owner_name 
            ? 'bg-blue-600 text-white shadow-inner' 
            : 'bg-white hover:bg-yellow-400 active:scale-90 active:bg-yellow-500'}`}
    >
      {isWinner ? `🏆 ${square.owner_name}` : (square.owner_name?.toUpperCase() || '')}
    </button>
  );
})}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ADMIN CONTROL PANEL */}
        {isAdmin && (
          <div className="mt-12 p-8 border-4 border-dashed border-red-200 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl font-black text-red-600 uppercase italic mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              Admin Kitchen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={randomizeNumbers} className="group relative bg-slate-900 p-4 rounded-xl transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg">
                <span className="text-white font-black uppercase italic">Draw & Reveal Numbers</span>
              </button>
              <button onClick={resetBoard} className="group relative bg-white border-4 border-red-600 p-4 rounded-xl transition-all hover:-translate-y-1 active:translate-y-0">
                <span className="text-red-600 font-black uppercase italic">Wipe Board (Reset)</span>
              </button>
            </div>
            {/* Score Entry Form */}
<div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
  {['q1', 'q2', 'q3', 'final'].map((period) => (
    <div key={period} className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase text-slate-400">{period} Score</label>
      <div className="flex gap-1">
        <input 
          placeholder="Pats"
          className="w-full p-2 border rounded text-xs font-bold"
          onBlur={(e) => supabase.from('settings').update({ [`${period}_pats`]: parseInt(e.target.value) }).eq('id', 1).then(fetchData)}
        />
        <input 
          placeholder="Hawks"
          className="w-full p-2 border rounded text-xs font-bold"
          onBlur={(e) => supabase.from('settings').update({ [`${period}_hawks`]: parseInt(e.target.value) }).eq('id', 1).then(fetchData)}
        />
      </div>
    </div>
  ))}
</div>
          </div>
        )}
      </div>
    </main>
  );
}