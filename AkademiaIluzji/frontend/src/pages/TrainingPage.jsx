import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import TrainingCompletionModal from '../components/TrainingCompletionModal';
import TrainingGeneratorModal from '../components/TrainingGeneratorModal';

export default function TrainingPage() {
  const { trainingQuickLaunch, setTrainingQuickLaunch, showToast } = useApp();
  
  // Studio Active State
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [repsCount, setRepsCount] = useState(0);
  const [targetReps, setTargetReps] = useState(50);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const timerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await api.getSessions(15, 0);
      setRecentSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Check if quick launched from Dashboard or Skill Tree
  useEffect(() => {
    if (trainingQuickLaunch) {
      startPlan(trainingQuickLaunch);
      setTrainingQuickLaunch(null);
    }
  }, [trainingQuickLaunch]);

  // Timer interval effect
  useEffect(() => {
    if (isTrainingActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTrainingActive, isPaused]);

  const startPlan = (plan) => {
    setCurrentPlan(plan);
    setCurrentExerciseIndex(0);
    setSecondsElapsed(0);
    setRepsCount(0);
    setTargetReps(plan?.plan_items?.[0]?.target_reps || 50);
    setIsTrainingActive(true);
    setIsPaused(false);
    showToast('Trening w studiu rozpoczęty. Skupienie i spokój!', 'info');
  };

  const handleNextExercise = () => {
    if (currentPlan && currentExerciseIndex + 1 < currentPlan.plan_items.length) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      const nextItem = currentPlan.plan_items[nextIdx];
      setTargetReps(nextItem.target_reps || 40);
      showToast(`Ćwiczenie ${nextIdx + 1}: ${nextItem.technique_name}`, 'info');
    } else {
      handleOpenCompletion();
    }
  };

  const handleOpenCompletion = () => {
    setIsPaused(true);
    setShowCompletionModal(true);
  };

  const handleAddMinute = () => {
    setSecondsElapsed(prev => prev + 60);
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentExercise = currentPlan?.plan_items?.[currentExerciseIndex];
  const nextExercise = currentPlan?.plan_items?.[currentExerciseIndex + 1];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* If training studio is active -> Show Distraction-Free Studio */}
      {isTrainingActive && currentExercise ? (
        <div className="bg-[#12131c] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
          
          {/* Top Status & Exercise Counter */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                STUDIO TRENINGOWE • ĆWICZENIE {currentExerciseIndex + 1} Z {currentPlan?.plan_items?.length || 1}
              </span>
            </div>

            <button
              onClick={handleOpenCompletion}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 transition-all"
            >
              Zakończ Sesję
            </button>
          </div>

          {/* Big Live Timer Display */}
          <div className="text-center py-4">
            <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white select-none drop-shadow-md">
              {formatTimer(secondsElapsed)}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isPaused
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                {isPaused ? '▶ Wznów' : '⏸ Pauza'}
              </button>

              <button
                onClick={handleAddMinute}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition-all"
              >
                +1 min
              </button>

              <button
                onClick={() => setSecondsElapsed(0)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-700 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Current Exercise Details */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                  {currentExercise.phase || 'Blok Techniczny'}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">{currentExercise.technique_name}</h2>
              </div>
              <span className="text-xs font-bold text-zinc-400">
                Czas bloku: {currentExercise.duration_minutes} min
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 bg-black/40 p-4 rounded-2xl border border-zinc-800 leading-relaxed">
              💡 <strong className="text-amber-300">Wskazówka:</strong> {currentExercise.focus_note || currentExercise.reason}
            </p>

            {/* Repetitions Counter */}
            <div className="p-4 rounded-2xl bg-zinc-850/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-300 block">Licznik powtórzeń chwytu:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{repsCount}</span>
                  <span className="text-xs font-semibold text-zinc-300">/ Cel: {targetReps}</span>
                </div>
                {repsCount >= targetReps && (
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">
                    ✅ TARGET COMPLETE! Osiągnięto cel powtórzeń.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRepsCount(prev => Math.max(0, prev - 5))}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-sm rounded-xl border border-zinc-700"
                >
                  -5
                </button>
                <button
                  onClick={() => setRepsCount(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-sm rounded-xl border border-zinc-700"
                >
                  -1
                </button>
                <button
                  onClick={() => setRepsCount(prev => prev + 1)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl shadow-md"
                >
                  +1
                </button>
                <button
                  onClick={() => setRepsCount(prev => prev + 5)}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-sm rounded-xl border border-amber-500/40"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Next exercise preview and switch button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {nextExercise ? (
                <p className="text-xs text-zinc-300">
                  Następne: <strong className="text-zinc-200">{nextExercise.technique_name}</strong> ({nextExercise.duration_minutes} min)
                </p>
              ) : (
                <p className="text-xs text-emerald-400 font-semibold">Ostatnie ćwiczenie w dzisiejszym planie!</p>
              )}

              <button
                onClick={handleNextExercise}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                {nextExercise ? 'Następne Ćwiczenie →' : 'Zakończ i Oceń Trening →'}
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* Standard Training Page Screen */
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎯</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">STUDIO TRENINGOWE</h1>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm">
                Skupienie, pamięć mięśniowa, automatyzacja chwytów i eliminacja błędów.
              </p>
            </div>

            <button
              onClick={() => setShowGeneratorModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              + Kreator Planu Treningu
            </button>
          </div>

          {/* Quick Launch Cards by Duration */}
          <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Wybierz czas i rozpocznij trening:</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={async () => {
                    const plan = await api.generateTrainingPlan(mins);
                    startPlan(plan);
                  }}
                  className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-rose-500/10 border border-zinc-800 hover:border-amber-500/40 text-center transition-all group"
                >
                  <span className="text-2xl font-black text-white group-hover:text-amber-300 block">{mins}</span>
                  <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider block mt-1">MINUT</span>
                </button>
              ))}
            </div>
          </div>

          {/* History of Past Training Sessions */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📜</span>
              <span>Historia Sesji Treningowych ({recentSessions.length})</span>
            </h3>

            {recentSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentSessions.map((s) => (
                  <div key={s.id} className="bg-[#12131c] border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-100">
                          {s.techniques?.map(t => t.name).join(', ') || 'Trening w studiu'}
                        </h4>
                        <p className="text-[11px] text-zinc-300">
                          {s.date?.slice(0, 16)} • {Math.round(s.duration_seconds / 60)} min • {s.reps_count} powtórzeń
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        ★ {s.rating}/10
                      </span>
                    </div>

                    {/* Multi-dimensional breakdown */}
                    <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div><span className="text-zinc-300 block">Control:</span><strong className="text-zinc-200">{s.score_control || 7}/10</strong></div>
                      <div><span className="text-zinc-300 block">Natural:</span><strong className="text-zinc-200">{s.score_naturalness || 7}/10</strong></div>
                      <div><span className="text-zinc-300 block">Timing:</span><strong className="text-zinc-200">{s.score_timing || 7}/10</strong></div>
                      <div><span className="text-zinc-300 block">Conf:</span><strong className="text-zinc-200">{s.score_confidence || 7}/10</strong></div>
                    </div>

                    {s.hardest_part && (
                      <p className="text-xs text-amber-200/80 bg-black/30 p-2 rounded-lg">
                        ⚠️ <strong className="text-amber-300">Trudność:</strong> {s.hardest_part}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#12131c] border border-zinc-800 rounded-2xl">
                <p className="text-xs text-zinc-300">Brak zarejestrowanych sesji. Rozpocznij trening powyżej!</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Completion Modal */}
      <TrainingCompletionModal
        isOpen={showCompletionModal}
        sessionData={{
          durationSeconds: secondsElapsed,
          repsCount: repsCount,
          techniqueIds: currentPlan?.plan_items?.map(i => i.technique_id) || []
        }}
        onClose={() => {
          setShowCompletionModal(false);
          setIsTrainingActive(false);
          fetchHistory();
        }}
        onSaved={() => {
          fetchHistory();
        }}
      />

      {/* Custom Training Generator Modal */}
      <TrainingGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onStartPlan={(plan) => {
          setShowGeneratorModal(false);
          startPlan(plan);
        }}
      />

    </div>
  );
}
