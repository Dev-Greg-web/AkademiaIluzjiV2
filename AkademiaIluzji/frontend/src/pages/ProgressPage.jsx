import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ProgressPage() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topTrained, setTopTrained] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const [sum, act, top, att, cats] = await Promise.all([
        api.getProgressSummary(),
        api.getActivity30Days(),
        api.getTopTrained(),
        api.getNeedsAttention(),
        api.getCategoriesBreakdown()
      ]);
      setSummary(sum);
      setActivity(act);
      setTopTrained(top);
      setNeedsAttention(att);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const totalMinutes = summary?.profile?.total_training_minutes || 0;
  const totalSessions = summary?.profile?.total_sessions_count || 0;
  const streak = summary?.profile?.streak || 0;
  const bestStreak = summary?.profile?.best_streak || 0;
  const avgRating = summary?.average_score || 7.0;

  // Max minutes in last 30 days for bar height calculation
  const maxDayMinutes = Math.max(...activity.map(d => d.minutes), 15);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📈</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">STATYSTYKI & ANALITYKA</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Pełny wgląd w czas spędzony z kartami, powtórzenia, postępy 3 ścieżek i regularność.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">ŁĄCZNY CZAS</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">{totalMinutes} min</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">UKOŃCZONE SESJE</span>
          <span className="text-xl font-black text-white mt-1 block">{totalSessions}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">AKTUALNY STREAK</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">🔥 {streak} dni</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">REKORD STREAKU</span>
          <span className="text-xl font-black text-rose-400 mt-1 block">💎 {bestStreak} dni</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">ŚR. SAMOOCENA</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">★ {avgRating}/10</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">OPANOWANE</span>
          <span className="text-xl font-black text-amber-300 mt-1 block">{summary?.techniques?.mastered || 0} technik</span>
        </div>
      </div>

      {/* 30-Day Activity Chart */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Aktywność w ostatnich 30 dniach (minuty)</h3>
          <span className="text-xs text-zinc-300">Minuty treningu / dzień</span>
        </div>

        <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 border-b border-zinc-800/80">
          {activity.map((d, idx) => {
            const barHeight = Math.max(4, Math.round((d.minutes / maxDayMinutes) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                  {d.label}: {d.minutes} min ({d.sessions} sesji)
                </div>

                <div
                  className={`w-full rounded-t-md transition-all ${
                    d.minutes > 0
                      ? 'bg-gradient-to-t from-amber-500 to-rose-500 group-hover:brightness-125 shadow-sm'
                      : 'bg-zinc-850'
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-zinc-300 font-semibold px-1">
          <span>30 dni temu</span>
          <span>Dzisiaj</span>
        </div>
      </div>

      {/* Top Trained vs Needs Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Trained */}
        <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>💪</span>
            <span>Najczęściej trenowane</span>
          </h3>

          <div className="space-y-3">
            {topTrained.map((t) => (
              <div key={t.id} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-zinc-100">{t.name}</h4>
                  <p className="text-[10px] text-zinc-300 mt-0.5">{t.category} • {t.total_reps_count} powtórzeń</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 block">{t.training_minutes} min</span>
                  <span className="text-[10px] text-zinc-300 font-semibold">{t.mastery_percentage}% mastery</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>⚠️</span>
            <span>Wymagające skupienia / Błędy</span>
          </h3>

          <div className="space-y-3">
            {needsAttention.map((t) => (
              <div key={t.id} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-xs text-zinc-100 truncate">{t.name}</h4>
                  <p className="text-[10px] text-rose-300 truncate mt-0.5">
                    {t.problem_notes || 'W toku szlifowania stabilności'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-zinc-300 block">{t.mastery_percentage}%</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{t.unresolved_problems || 0} błędów</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
