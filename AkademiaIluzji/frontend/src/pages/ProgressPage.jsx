import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import LevelBadge from '../components/LevelBadge';
import { 
  BarChart3, 
  Clock, 
  Flame, 
  Sparkles, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function ProgressPage() {
  const { profile } = useApp();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topTrained, setTopTrained] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

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
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const maxMinutes = Math.max(30, ...activity.map((d) => d.minutes || 0));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          📊 Analityka & Postęp Iluzjonisty
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Szczegółowy przegląd aktywności, rozwój pamięci mięśniowej i rozkład opanowania technik
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 shadow-md space-y-1">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-400" />
            Łączny czas
          </span>
          <p className="text-2xl font-black text-white font-mono">
            {summary?.profile?.total_training_minutes || 0} <span className="text-xs font-normal text-zinc-400">min</span>
          </p>
          <p className="text-[11px] text-zinc-400">
            {summary?.profile?.total_sessions_count || 0} sesji treningowych
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 shadow-md space-y-1">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Opanowane techniki
          </span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {summary?.techniques?.mastered || 0} <span className="text-xs font-normal text-zinc-400">/ {summary?.techniques?.total || 0}</span>
          </p>
          <p className="text-[11px] text-zinc-400">
            {summary?.techniques?.mastery_rate || 0}% całego arsenału
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 shadow-md space-y-1">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            Aktualny Streak
          </span>
          <p className="text-2xl font-black text-orange-400 font-mono">
            {summary?.profile?.streak || 0} <span className="text-xs font-normal text-zinc-400">dni</span>
          </p>
          <p className="text-[11px] text-zinc-400">
            Ciągłość treningu
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 shadow-md space-y-1">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Aktywne problemy
          </span>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {summary?.problems?.unresolved || 0}
          </p>
          <p className="text-[11px] text-zinc-400">
            Wymagające korekty
          </p>
        </div>
      </div>

      {/* 30-Day Activity Chart */}
      <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              Czas treningu — ostatnie 30 dni
            </h3>
            <p className="text-xs text-zinc-400">Wykres dziennej aktywności w minutach</p>
          </div>

          {hoveredBar && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-rose-300 font-bold animate-in fade-in">
              {hoveredBar.date}: {hoveredBar.minutes} min ({hoveredBar.sessions} sesji, +{hoveredBar.xp} XP)
            </div>
          )}
        </div>

        {/* Custom Bar Graph */}
        <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-zinc-800">
          {activity.map((day, idx) => {
            const heightPercent = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
            const hasTrained = day.minutes > 0;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredBar(day)}
                onMouseLeave={() => setHoveredBar(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                <div
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                  className={`w-full max-w-[16px] rounded-t-md transition-all duration-300 ${
                    hasTrained
                      ? 'bg-gradient-to-t from-rose-700 to-red-500 group-hover:from-rose-500 group-hover:to-red-400 shadow-sm shadow-rose-950'
                      : 'bg-zinc-800/40 group-hover:bg-zinc-700/60'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono px-1">
          <span>{activity[0]?.label || '30 dni temu'}</span>
          <span>{activity[14]?.label || '15 dni temu'}</span>
          <span>Dziś ({activity[activity.length - 1]?.label})</span>
        </div>
      </div>

      {/* Grid: Top Trained vs Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trained */}
        <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Najczęściej trenowane techniki
            </h3>
          </div>

          <div className="space-y-2.5">
            {topTrained.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4">Brak danych treningowych.</p>
            ) : (
              topTrained.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-zinc-800 font-mono font-bold text-zinc-400 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <p className="text-[11px] text-zinc-400">{t.category} • {t.sessions_count} sesji</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-sm">{t.training_minutes} min</span>
                    <div className="mt-0.5">
                      <LevelBadge level={t.user_level} size="sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Techniki wymagające największej uwagi
            </h3>
          </div>

          <div className="space-y-2.5">
            {needsAttention.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4">Wszystkie chwyty są w doskonałej kondycji!</p>
            ) : (
              needsAttention.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <LevelBadge level={t.user_level} size="sm" />
                    </div>
                    {t.unresolved_problems > 0 ? (
                      <p className="text-[11px] text-amber-400/90 font-medium">
                        ⚠️ {t.unresolved_problems} problem: {t.problem_notes?.slice(0, 45)}...
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {t.last_trained_at ? `Ćwiczone: ${t.last_trained_at.slice(0, 10)}` : 'Nie rozpoczęto ćwiczeń'}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/30">
                    {t.difficulty}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Categories Mastery Breakdown */}
      <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Stopień opanowania według kategorii
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {categories.map((c) => (
            <div key={c.category} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{c.category}</span>
                <span className="font-mono text-zinc-400">{c.mastered_count}/{c.total_count} opanowanych</span>
              </div>

              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${c.mastery_percent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>Śr. poziom: {c.avg_level}/10</span>
                <span className="text-rose-400 font-bold">{c.mastery_percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
