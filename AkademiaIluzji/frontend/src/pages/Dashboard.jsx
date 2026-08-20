import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import TrainingGeneratorModal from '../components/TrainingGeneratorModal';
import OnboardingModal from '../components/OnboardingModal';

export default function Dashboard() {
  const { profile, loadingProfile, startQuickTraining, setActiveTab, setSelectedTechniqueId, showToast } = useApp();
  const [nextStep, setNextStep] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [reviewNeeded, setReviewNeeded] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [copiedContext, setCopiedContext] = useState(false);

  const loadDashboardData = async (duration = 20) => {
    try {
      setLoading(true);
      const [stepData, planData, reviewData, summaryData, sessionsData] = await Promise.all([
        api.getNextStep(),
        api.generateTrainingPlan(duration),
        api.getReviewNeeded(),
        api.getProgressSummary(),
        api.getSessions(5, 0)
      ]);

      setNextStep(stepData);
      setDailyPlan(planData);
      setReviewNeeded(reviewData);
      setSummary(summaryData);
      setRecentSessions(sessionsData);

      // Trigger onboarding on first run if not completed
      if (profile && profile.onboarding_completed === 0) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.preferred_daily_minutes) {
      setSelectedDuration(profile.preferred_daily_minutes);
      loadDashboardData(profile.preferred_daily_minutes);
    } else {
      loadDashboardData(20);
    }
  }, [profile?.preferred_daily_minutes]);

  const handleDurationChange = async (mins) => {
    setSelectedDuration(mins);
    try {
      const newPlan = await api.generateTrainingPlan(mins);
      setDailyPlan(newPlan);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickCopyGpt = async () => {
    try {
      const res = await api.getContext('quick');
      await navigator.clipboard.writeText(res.context_text);
      setCopiedContext(true);
      showToast('Skopiowano kontekst dla ChatGPT do schowka!', 'success');
      setTimeout(() => setCopiedContext(false), 3000);
    } catch (err) {
      showToast('Błąd kopiowania: ' + err.message, 'error');
    }
  };

  const name = profile?.name || 'Adept Iluzji';
  const rankTier = profile?.rank_tier || 'Beginner';
  const level = profile?.level_info?.level || profile?.level || 1;
  const rankTitle = profile?.level_info?.title || 'Adept Iluzji';
  const streak = profile?.streak || 0;
  const totalMinutes = profile?.total_training_minutes || 0;
  const masteredCount = summary?.techniques?.mastered || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cześć, <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">{name}</span>
            </h1>
          </div>
          <p className="text-zinc-300 text-sm">
            Twój osobisty <strong className="text-zinc-200">Card Magic Coach</strong> przygotował rekomendacje treningowe na dziś.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleQuickCopyGpt}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              copiedContext
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/80 shadow-sm'
            }`}
          >
            <span>{copiedContext ? '✓' : '🤖'}</span>
            <span>{copiedContext ? 'Skopiowano!' : 'Kopiuj Kontekst ChatGPT'}</span>
          </button>

          <button
            onClick={() => setShowGeneratorModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md transition-all"
          >
            <span>🎯</span>
            <span>Własny Trening</span>
          </button>
        </div>
      </div>

      {/* 3 Core Progression Tracks Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Track 1: Magic */}
        <div 
          onClick={() => setActiveTab('magic')}
          className="bg-[#12131c] hover:bg-[#161724] border border-zinc-800/80 hover:border-amber-500/40 p-4 rounded-2xl cursor-pointer transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🃏</span>
              <span className="font-bold text-sm text-zinc-200 group-hover:text-amber-300">MAGIC</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Lvl {profile?.track_levels?.magic?.level || 1}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 line-clamp-1 mb-2">Grips, Controls, Forces, Sleights, Counts</p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all" 
              style={{ width: `${profile?.track_levels?.magic?.progress_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Track 2: Cardistry */}
        <div 
          onClick={() => setActiveTab('cardistry')}
          className="bg-[#12131c] hover:bg-[#161724] border border-zinc-800/80 hover:border-rose-500/40 p-4 rounded-2xl cursor-pointer transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">♠️</span>
              <span className="font-bold text-sm text-zinc-200 group-hover:text-rose-300">CARDISTRY</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
              Lvl {profile?.track_levels?.cardistry?.level || 1}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 line-clamp-1 mb-2">Cuts, Fans, Spreads, Packets, Flourishes</p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all" 
              style={{ width: `${profile?.track_levels?.cardistry?.progress_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Track 3: Performance */}
        <div 
          onClick={() => setActiveTab('performance')}
          className="bg-[#12131c] hover:bg-[#161724] border border-zinc-800/80 hover:border-amber-400/40 p-4 rounded-2xl cursor-pointer transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎭</span>
              <span className="font-bold text-sm text-zinc-200 group-hover:text-amber-300">PERFORMANCE</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300">
              Lvl {profile?.track_levels?.performance?.level || 1}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 line-clamp-1 mb-2">Timing, Misdirection, Patter, Mowa ciała</p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 rounded-full transition-all" 
              style={{ width: `${profile?.track_levels?.performance?.progress_percent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Focus: 1. TWÓJ NASTĘPNY KROK & 2. DZISIEJSZY TRENING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Today's Training Card (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#12131c] to-[#181926] border border-zinc-750/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">PLAN GŁÓWNY</span>
                <span className="text-xs text-zinc-300">•</span>
                <span className="text-xs font-medium text-zinc-300">Deterministyczny dobór</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">DZISIEJSZY TRENING</h2>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              {[10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleDurationChange(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedDuration === mins
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Items Breakdown */}
          <div className="space-y-3 mb-6">
            {dailyPlan?.plan_items?.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    {item.order}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-100 truncate">{item.technique_name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 truncate mt-0.5">{item.focus_note || item.reason}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400 block">{item.duration_minutes} min</span>
                  <span className="text-[10px] text-zinc-300 block">{item.target_reps} powtórzeń</span>
                </div>
              </div>
            ))}
          </div>

          {/* Start CTA Button */}
          <button
            onClick={() => startQuickTraining(dailyPlan)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:brightness-110 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
          >
            <span>🔥</span>
            <span>ROZPOCZNIJ DZISIEJSZY TRENING ({selectedDuration} MIN)</span>
          </button>
        </div>

        {/* Right Column: "TWÓJ NASTĘPNY KROK" & Spaced Repetition (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prominent Next Single Step Card */}
          {nextStep && (
            <div className="bg-gradient-to-br from-[#1c1917] to-[#12131c] border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  TWÓJ NASTĘPNY KROK
                </span>
                <span className="text-xs text-zinc-300 font-medium">Co teraz zrobić?</span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                <span>→</span>
                <span>{nextStep.action_text}</span>
              </h3>

              <p className="text-xs text-amber-200/80 mb-3 leading-relaxed">
                <strong className="text-amber-300">Powód:</strong> {nextStep.reason}
              </p>

              <div className="bg-black/30 rounded-xl p-3 border border-zinc-800/80 mb-4 text-xs text-zinc-300">
                💡 <span className="italic">{nextStep.focus_tip}</span>
              </div>

              <button
                onClick={() => {
                  startQuickTraining({
                    total_minutes: nextStep.duration_minutes,
                    plan_items: [{
                      order: 1,
                      technique_id: nextStep.technique_id,
                      technique_name: nextStep.technique_name,
                      category: nextStep.category,
                      duration_minutes: nextStep.duration_minutes,
                      target_reps: nextStep.target_reps,
                      focus_note: nextStep.focus_tip,
                      reason: nextStep.reason
                    }]
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Wykonaj ten krok</span>
                <span>→</span>
              </button>
            </div>
          )}

          {/* Review Needed (Spaced Repetition) */}
          <div className="bg-[#12131c] border border-zinc-800/80 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⏳</span>
                <h3 className="font-bold text-sm text-zinc-100">Wymagające powtórki</h3>
              </div>
              <span className="text-[10px] text-zinc-300">Spaced Repetition</span>
            </div>

            {reviewNeeded.length > 0 ? (
              <div className="space-y-2">
                {reviewNeeded.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedTechniqueId(item.id);
                      setActiveTab('magic');
                    }}
                    className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-zinc-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-amber-400/90 truncate">{item.primary_reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                        {item.mastery_percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-300 text-center py-4">
                ✓ Wszystkie ćwiczone techniki są w dobrej kondycji pamięciowej!
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Bottom Row: Recent Activity & Active Problems Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Training Sessions */}
        <div className="bg-[#12131c] border border-zinc-800/80 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <span>📈</span>
              <span>Ostatnio trenowane</span>
            </h3>
            <button
              onClick={() => setActiveTab('progress')}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              Wszystkie sesje →
            </button>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-2.5">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-zinc-200">
                      {s.techniques?.map(t => t.name).join(', ') || 'Trening ogólny'}
                    </p>
                    <p className="text-[10px] text-zinc-300 mt-0.5">
                      {s.date?.slice(0, 16)} • {Math.round(s.duration_seconds / 60)} min • {s.reps_count} reps
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ★ {s.rating}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-300 py-6 text-center">
              Brak zarejestrowanych sesji. Rozpocznij swój pierwszy trening powyżej!
            </p>
          )}
        </div>

        {/* Repertoire & Quick Routine Generator Shortcut */}
        <div className="bg-[#12131c] border border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <span>🎪</span>
                <span>Generator Rutyn Karcianych</span>
              </h3>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Klasyki
              </span>
            </div>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Sprawdź, które klasyczne i nowoczesne rutyny karciane (Ambitious Card, Triumph, Oil & Water, Chicago Opener) możesz wykonać w oparciu o opanowane sleighty.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('routines')}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Przejdź do Generatora Rutyn</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* Modals */}
      <TrainingGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onStartPlan={(customPlan) => {
          setShowGeneratorModal(false);
          startQuickTraining(customPlan);
        }}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

    </div>
  );
}
