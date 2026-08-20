import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import TrainingCompletionModal from '../components/TrainingCompletionModal';
import TrainingGeneratorModal from '../components/TrainingGeneratorModal';
import LevelBadge from '../components/LevelBadge';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Plus, 
  Minus, 
  Sparkles, 
  Clock, 
  Target, 
  Dumbbell, 
  Calendar, 
  Star, 
  CheckCircle,
  FileText,
  ChevronRight,
  Layers
} from 'lucide-react';

export default function TrainingPage() {
  const { trainingQuickLaunch, setTrainingQuickLaunch, showToast, refreshProfile } = useApp();

  // Techniques list for dropdown selector
  const [allTechniques, setAllTechniques] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedTech, setSelectedTech] = useState(null);

  // Active workout plan if generated
  const [activePlan, setActivePlan] = useState(null);
  const [currentPlanStepIdx, setCurrentPlanStepIdx] = useState(0);

  // Timer states
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStartedApiCalled, setHasStartedApiCalled] = useState(false);

  // Reps counter
  const [reps, setReps] = useState(0);

  // Live session scratchpad
  const [sessionNotes, setSessionNotes] = useState('');

  // Modals & past sessions
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Timer interval ref
  const timerRef = useRef(null);

  const fetchTechniquesAndHistory = async () => {
    try {
      const [techs, sessions] = await Promise.all([
        api.getTechniques(),
        api.getSessions(15)
      ]);
      setAllTechniques(techs);
      setPastSessions(sessions);

      if (techs.length > 0 && !selectedTechId) {
        setSelectedTechId(techs[0].id.toString());
        setSelectedTech(techs[0]);
      }
    } catch (err) {
      console.error('Error fetching training data:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchTechniquesAndHistory();
  }, []);

  // Handle incoming quick launch payload from Dashboard or Technique detail
  useEffect(() => {
    if (trainingQuickLaunch) {
      if (trainingQuickLaunch.is_generated_plan) {
        setActivePlan(trainingQuickLaunch);
        setCurrentPlanStepIdx(0);
        const firstItem = trainingQuickLaunch.plan_items[0];
        if (firstItem) {
          setSelectedTechId(firstItem.technique_id.toString());
        }
      } else if (trainingQuickLaunch.technique_id) {
        setSelectedTechId(trainingQuickLaunch.technique_id.toString());
        setActivePlan(null);
      }
      // Reset timer and reps for new session
      setSeconds(0);
      setReps(0);
      setIsActive(false);
      setIsPaused(false);
      setHasStartedApiCalled(false);
    }
  }, [trainingQuickLaunch]);

  // Sync selectedTech object when selectedTechId changes
  useEffect(() => {
    if (selectedTechId && allTechniques.length) {
      const found = allTechniques.find((t) => t.id.toString() === selectedTechId.toString());
      setSelectedTech(found || null);
    }
  }, [selectedTechId, allTechniques]);

  // Stopwatch effect
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  const handleStartTimer = async () => {
    setIsActive(true);
    setIsPaused(false);

    if (!hasStartedApiCalled) {
      try {
        const res = await api.startTraining();
        showToast(res.message, 'info', res.xp_gained);
        refreshProfile();
        setHasStartedApiCalled(true);
      } catch (e) {
        console.error('Start training log error:', e);
      }
    }
  };

  const handlePauseTimer = () => {
    setIsPaused(true);
  };

  const handleFinishTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setCompletionModalOpen(true);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setSeconds(0);
    setReps(0);
    setHasStartedApiCalled(false);
  };

  const handleSessionSaved = () => {
    handleResetTimer();
    setActivePlan(null);
    setTrainingQuickLaunch(null);
    fetchTechniquesAndHistory();
  };

  // Format timer HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            🏋️ Centrum Treningowe
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Mierz czas, rejestruj powtórzenia chwytów, eliminuj mikrobłędy i zdobywaj XP
          </p>
        </div>

        <button
          onClick={() => setGeneratorModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-950/30 transition active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Wygeneruj plan treningowy
        </button>
      </div>

      {/* Main Active Workout Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stopwatch & Action Core (2 cols) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#161724] to-[#101118] border border-zinc-800 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Subtle glowing card background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top selector / Phase header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Trenowany chwyt:
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-rose-500 w-full sm:max-w-xs"
              >
                {allTechniques.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category} - {t.user_level}/10)
                  </option>
                ))}
              </select>
            </div>

            {selectedTech && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {selectedTech.category}
                </span>
                <LevelBadge level={selectedTech.user_level} size="sm" />
              </div>
            )}
          </div>

          {/* Active Plan Steps Bar (if workout generated) */}
          {activePlan?.plan_items && (
            <div className="relative z-10 p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Struktura planu ({activePlan.duration_minutes} min):
                </span>
                <span className="text-zinc-400 font-mono">
                  Faza {currentPlanStepIdx + 1} z {activePlan.plan_items.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activePlan.plan_items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentPlanStepIdx(idx);
                      setSelectedTechId(item.technique_id.toString());
                    }}
                    className={`p-2 rounded-xl text-left text-xs transition border ${
                      currentPlanStepIdx === idx
                        ? 'bg-rose-950/60 border-rose-600 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="truncate font-semibold">{item.technique_name}</p>
                    <p className="text-[10px] opacity-75 font-mono">{item.duration_minutes} min • {item.phase}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Giant Timer Display */}
          <div className="relative z-10 py-6 sm:py-10 text-center space-y-2">
            <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white select-none drop-shadow-md">
              {formatTime(seconds)}
            </div>
            <p className="text-xs sm:text-sm font-medium text-zinc-400">
              {isActive && !isPaused ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Sesja w toku — pełne skupienie
                </span>
              ) : isPaused ? (
                <span className="text-amber-400 font-bold">Wstrzymano (Pauza)</span>
              ) : (
                <span>Gotowy do rozpoczęcia treningu</span>
              )}
            </p>
          </div>

          {/* Reps Counter & Quick Increments */}
          <div className="relative z-10 p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-zinc-400 font-semibold">Licznik powtórzeń</p>
                <p className="text-2xl font-black text-white font-mono">{reps}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setReps(Math.max(0, reps - 1))}
                className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm border border-zinc-700 flex items-center justify-center transition active:scale-90"
              >
                -1
              </button>
              <button
                onClick={() => setReps(reps + 1)}
                className="px-3.5 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 flex items-center justify-center gap-1 transition active:scale-90"
              >
                +1
              </button>
              <button
                onClick={() => setReps(reps + 5)}
                className="px-3.5 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 flex items-center justify-center gap-1 transition active:scale-90"
              >
                +5
              </button>
              <button
                onClick={() => setReps(reps + 10)}
                className="px-3.5 h-9 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-sm border border-rose-800/60 flex items-center justify-center gap-1 transition active:scale-90"
              >
                +10
              </button>
            </div>
          </div>

          {/* Action Buttons: START / PAUSE / FINISH / RESET */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isActive || isPaused ? (
              <button
                onClick={handleStartTimer}
                className="px-8 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-xl shadow-rose-950/60 transition-all duration-200 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                {seconds > 0 ? 'WZNÓW TRENING' : 'START TRENING'}
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-xl shadow-amber-950/60 transition active:scale-95"
              >
                <Pause className="w-5 h-5 fill-white" />
                PAUZA
              </button>
            )}

            <button
              onClick={handleFinishTimer}
              disabled={seconds < 5}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              ZAKOŃCZ
            </button>

            <button
              onClick={handleResetTimer}
              disabled={seconds === 0 && reps === 0}
              className="p-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition active:scale-95 disabled:opacity-30"
              title="Resetuj stoper"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side Panel: Technique Notes & Focus Reminders (1 col) */}
        <div className="space-y-6">
          {/* Card: Wskazówki do wybranego chwytu */}
          <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Wskazówki wykonawcze
            </h3>

            {selectedTech ? (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">{selectedTech.name}</h4>
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-2">
                  <p className="font-medium text-rose-300">
                    💡 {selectedTech.notes || selectedTech.description || 'Pamiętaj o rozluźnieniu palców i naturalnym rytmie dłoni.'}
                  </p>
                </div>

                <div className="text-[11px] text-zinc-400 space-y-1 font-mono">
                  <p>• Poziom: {selectedTech.user_level}/10</p>
                  <p>• Łączny czas ćwiczeń: {selectedTech.training_minutes} min</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Wybierz technikę z listy.</p>
            )}
          </div>

          {/* Card: Quick Session Scratchpad */}
          <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-400" />
              Bieżące notatki z sesji
            </h3>
            <textarea
              rows={4}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Zapisuj na bieżąco spostrzeżenia, które karty sprawiają opór, co zmienić w chwycie..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
            />
          </div>
        </div>
      </div>

      {/* History of Past Training Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            Historia ostatnich sesji treningowych
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            Łącznie: {pastSessions.length} sesji
          </span>
        </div>

        {loadingSessions ? (
          <div className="py-12 text-center text-zinc-400">Ładowanie historii...</div>
        ) : pastSessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#12131b] border border-zinc-800 text-zinc-400 text-sm">
            Brak zarejestrowanych treningów. Kliknij START powyżej, aby rozpocząć pierwszą sesję!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastSessions.map((s) => {
              const durMins = Math.max(1, Math.round(s.duration_seconds / 60));
              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 hover:border-zinc-700 transition space-y-3 flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-zinc-400">
                            {s.date?.slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 truncate">
                          {s.techniques && s.techniques.length > 0
                            ? s.techniques.map((t) => t.name).join(', ')
                            : 'Trening ogólny'}
                        </h4>
                      </div>

                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {s.rating}/10
                      </span>
                    </div>

                    {/* Reflections */}
                    <div className="space-y-1 text-xs text-zinc-300 pt-1">
                      {s.what_went_well && (
                        <p className="line-clamp-1">
                          <strong className="text-emerald-400">+</strong> {s.what_went_well}
                        </p>
                      )}
                      {s.what_was_problem && (
                        <p className="line-clamp-1">
                          <strong className="text-amber-400">-</strong> {s.what_was_problem}
                        </p>
                      )}
                      {s.what_to_improve && (
                        <p className="line-clamp-1">
                          <strong className="text-sky-400">→</strong> {s.what_to_improve}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
                    <span>{durMins} min ({s.reps_count || 0} powt.)</span>
                    <span className="text-amber-400 font-bold">+{s.xp_earned} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generator Modal */}
      <TrainingGeneratorModal
        isOpen={generatorModalOpen}
        onClose={() => setGeneratorModalOpen(false)}
      />

      {/* Completion Modal */}
      <TrainingCompletionModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        durationSeconds={seconds}
        repsCount={reps}
        techniqueIds={selectedTechId ? [Number(selectedTechId)] : []}
        workoutTitle={selectedTech?.name || 'Trening chwytów'}
        onSessionSaved={handleSessionSaved}
      />
    </div>
  );
}
