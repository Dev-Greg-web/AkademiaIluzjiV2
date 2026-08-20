import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { X, Sparkles, Clock, Target, Play, ChevronRight } from 'lucide-react';

export default function TrainingGeneratorModal({ isOpen, onClose }) {
  const { startQuickTraining, showToast } = useApp();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = async (mins) => {
    try {
      setLoading(true);
      const data = await api.generateTrainingPlan(mins);
      setPlan(data);
    } catch (err) {
      showToast('Błąd generowania planu treningowego', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlan(selectedDuration);
    }
  }, [isOpen, selectedDuration]);

  if (!isOpen) return null;

  const handleStartWorkout = () => {
    if (!plan || !plan.plan_items?.length) return;
    onClose();
    startQuickTraining({
      is_generated_plan: true,
      duration_minutes: plan.total_minutes,
      plan_items: plan.plan_items
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111219] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-[#151622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Inteligentny Generator Treningu
              </h2>
              <p className="text-xs text-zinc-400">
                Algorytm dobiera chwyty na podstawie poziomu, trudności i zanotowanych błędów
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duration Selector Tabs */}
        <div className="p-6 pb-2 border-b border-zinc-800/50">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 block">
            Wybierz dostępny czas na trening:
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedDuration(mins)}
                className={`py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border ${
                  selectedDuration === mins
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40 scale-[1.02]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{mins} min</span>
                <span className="text-[10px] font-normal opacity-80">
                  {mins === 15 ? 'Ekspres' : mins === 30 ? 'Optymalny' : mins === 45 ? 'Intensywny' : 'Mistrzowski'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Plan Breakdown Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-zinc-400">Generowanie zbalansowanego planu treningowego...</p>
            </div>
          ) : plan?.plan_items?.length ? (
            plan.plan_items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition space-y-2 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base group-hover:text-rose-400 transition">
                          {item.technique_name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-rose-400/90 font-medium mt-0.5">
                        {item.phase}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-800/80 text-white border border-zinc-700">
                      <Clock className="w-3 h-3 text-rose-400" />
                      {item.duration_minutes} min
                    </span>
                  </div>
                </div>

                {/* Focus Note and Reason */}
                <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <p className="text-zinc-300 italic flex-1 truncate">
                    💡 {item.focus_note}
                  </p>
                  <span className="text-[11px] text-amber-400/90 font-medium shrink-0">
                    🎯 {item.reason}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-400 py-12">Brak wygenerowanych pozycji.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#151622] flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">
            Anuluj
          </button>

          <button
            onClick={handleStartWorkout}
            disabled={loading || !plan?.plan_items?.length}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            Rozpocznij ten trening ({selectedDuration} min)
          </button>
        </div>
      </div>
    </div>
  );
}
