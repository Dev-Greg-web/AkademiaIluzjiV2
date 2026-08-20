import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import LevelBadge from '../components/LevelBadge';
import TrainingGeneratorModal from '../components/TrainingGeneratorModal';
import TechniqueModal from '../components/TechniqueModal';
import { 
  Dumbbell, 
  Flame, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronRight, 
  Play, 
  Target, 
  AlertCircle,
  TrendingUp,
  Layers,
  BrainCircuit
} from 'lucide-react';

export default function Dashboard() {
  const { profile, setActiveTab, startQuickTraining, showToast } = useApp();
  const [recentTechniques, setRecentTechniques] = useState([]);
  const [topFocusTech, setTopFocusTech] = useState(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedTechModalId, setSelectedTechModalId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [techs, attention] = await Promise.all([
        api.getTechniques(),
        api.getNeedsAttention()
      ]);

      // Set focus technique: priority to items needing attention or first in-progress/beginner
      if (attention && attention.length > 0) {
        setTopFocusTech(attention[0]);
      } else if (techs && techs.length > 0) {
        const inProg = techs.find((t) => t.user_level > 0 && t.user_level < 8);
        setTopFocusTech(inProg || techs[0]);
      }

      // Recent techniques (trained or in progress)
      const recent = techs
        .filter((t) => t.training_minutes > 0 || t.user_level > 0)
        .slice(0, 4);
      setRecentTechniques(recent.length ? recent : techs.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStartTodayWorkout = () => {
    if (!topFocusTech) {
      setActiveTab('training');
      return;
    }
    startQuickTraining({
      technique_id: topFocusTech.id,
      technique_name: topFocusTech.name,
      category: topFocusTech.category,
      difficulty: topFocusTech.difficulty,
      duration_minutes: 20,
      target_reps: 80,
      focus_note: topFocusTech.problem_notes ? `Rozwiąż problem: ${topFocusTech.problem_notes}` : topFocusTech.description
    });
  };

  const levelInfo = profile?.level_info || {
    level: 1,
    title: 'Adept Iluzji',
    total_xp: 0,
    progress_percent: 0,
    xp_needed: 100
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Akademia Iluzji Karczianej
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Witaj w Akademii Iluzji.
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-1">
            Twój cel: <span className="text-zinc-200 font-medium">stać się coraz lepszym iluzjonistą karcianym.</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('context')}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition group"
          >
            <BrainCircuit className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            GPT Context
          </button>
          <button
            onClick={() => setGeneratorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Generator treningu
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Poziom */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Aktualny poziom</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white font-mono">
              Level {levelInfo.level}
            </p>
            <p className="text-xs text-amber-300 font-medium truncate mt-0.5">
              {levelInfo.title}
            </p>
          </div>
          {/* Subtle bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500 opacity-80" />
        </div>

        {/* Card 2: XP */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Doświadczenie (XP)</span>
            <Sparkles className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white font-mono">
              {profile?.xp || 0} <span className="text-xs font-normal text-zinc-400">XP</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {levelInfo.xp_needed > 0 ? `+${levelInfo.xp_needed} do Lv ${levelInfo.level + 1}` : 'Maksymalna ranga'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600 opacity-80" />
        </div>

        {/* Card 3: Streak */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Dni z rzędu (Streak)</span>
            <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-orange-400 font-mono flex items-center gap-1.5">
              {profile?.streak || 0} <span className="text-xs font-normal text-zinc-400">dni</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {profile?.streak > 0 ? 'Ogień płonie! Nie przerywaj.' : 'Zrób dziś trening i zacznij passę!'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-80" />
        </div>

        {/* Card 4: Łączny czas */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Łączny czas treningu</span>
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white font-mono">
              {profile?.total_training_minutes || 0} <span className="text-xs font-normal text-zinc-400">min</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {profile?.total_sessions_count || 0} zakończonych sesji
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 opacity-80" />
        </div>
      </div>

      {/* Hero: DZISIAJ ĆWICZYSZ */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1c1218] via-[#14141e] to-[#0e0f16] border border-rose-900/40 shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-md">
                DZISIAJ ĆWICZYSZ
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Rekomendacja na dziś
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {topFocusTech?.name || 'Double Lift'}
                {topFocusTech && <LevelBadge level={topFocusTech.user_level} />}
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {topFocusTech?.description || 'Podstawowy i najważniejszy sleight karciany. Perfekcyjny get-ready i naturalność ruchu.'}
              </p>
            </div>

            {/* Quick specifications */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Sugerowany czas: <strong>20 min</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Cel: <strong>80 czystych powtórzeń</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Kategoria: <strong>{topFocusTech?.category || 'Sleights'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={handleStartTodayWorkout}
              className="px-8 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-rose-950/60 transition-all duration-200 active:scale-95 group"
            >
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition" />
              <span>ROZPOCZNIJ TRENING</span>
            </button>

            <button
              onClick={() => setGeneratorOpen(true)}
              className="px-6 py-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-700/60 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Wygeneruj plan (15–60 min)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Następny Cel & Ostatnie Postępy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Goal Card (1 col) */}
        <div className="p-6 rounded-2xl bg-[#12131b] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500" />
                Następny cel
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/40">
                Priorytet
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-snug">
              „{profile?.primary_goal || 'Opanuj Double Lift na poziomie 8/10.'}”
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Osiągnięcie poziomu 8/10 (Master) daje +100 XP i odblokowuje pełną swobodę w budowaniu zaawansowanych rutyn.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('techniques')}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
            >
              Zobacz bazę technik
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Progress / Techniques (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#12131b] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Ostatnie postępy i trenowane techniki
            </span>
            <button
              onClick={() => setActiveTab('techniques')}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Wszystkie ({recentTechniques.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentTechniques.map((tech) => (
              <div
                key={tech.id}
                onClick={() => setSelectedTechModalId(tech.id)}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 truncate">
                  <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition truncate">
                    {tech.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>{tech.category}</span>
                    <span>•</span>
                    <span className="font-mono">{tech.training_minutes} min</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <LevelBadge level={tech.user_level} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generator Modal */}
      <TrainingGeneratorModal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
      />

      {/* Technique Detail Modal */}
      {selectedTechModalId && (
        <TechniqueModal
          techniqueId={selectedTechModalId}
          onClose={() => setSelectedTechModalId(null)}
          onTechniqueUpdated={loadDashboardData}
        />
      )}
    </div>
  );
}
