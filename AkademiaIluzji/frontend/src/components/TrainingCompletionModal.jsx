import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Sparkles, Trophy, Star, CheckCircle, Clock, RotateCw, X } from 'lucide-react';

export default function TrainingCompletionModal({ 
  isOpen, 
  onClose, 
  durationSeconds, 
  repsCount, 
  techniqueIds,
  workoutTitle,
  onSessionSaved 
}) {
  const { showToast, fireConfetti, refreshProfile } = useApp();
  const [rating, setRating] = useState(8);
  const [reps, setReps] = useState(repsCount || 30);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasProblem, setWhatWasProblem] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        duration_seconds: durationSeconds,
        reps_count: reps,
        rating: rating,
        what_went_well: whatWentWell.trim(),
        what_was_problem: whatWasProblem.trim(),
        what_to_improve: whatToImprove.trim(),
        notes: notes.trim(),
        technique_ids: techniqueIds || []
      };

      const res = await api.finishTraining(payload);
      fireConfetti();
      showToast(`Trening zapisany! Zdobyłeś +${res.xp_earned} XP! 🔥 Streak: ${res.new_streak} dni`, 'success', res.xp_earned);
      refreshProfile();
      if (onSessionSaved) onSessionSaved(res.session);
      onClose();
    } catch (err) {
      showToast('Błąd zapisu sesji treningowej', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#111219] border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-b from-[#1c141d] to-[#12131b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/40">
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Trening Ukończony!
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {workoutTitle || 'Sesja treningowa'} • {durationMinutes} min • {reps} powtórzeń
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-400" />
              <div>
                <p className="text-[11px] text-zinc-400">Czas sesji</p>
                <p className="text-base font-bold text-white font-mono">{durationMinutes} min</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <RotateCw className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <p className="text-[11px] text-zinc-400">Liczba powtórzeń</p>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  className="bg-transparent font-bold text-base text-white font-mono w-full focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rating 1-10 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Ocena własna z sesji:
              </label>
              <span className="text-sm font-bold text-amber-400 font-mono flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {rating}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono px-1">
              <span>1 (Słabo / Spadek formy)</span>
              <span>5 (Poprawnie)</span>
              <span>10 (Perfekcyjne czucie kart)</span>
            </div>
          </div>

          {/* Reflection fields */}
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                ✨ Co poszło dobrze?
              </label>
              <input
                type="text"
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                placeholder="Np. Płynny obrót kart, brak dźwięku kliknięcia, zrelaksowana dłoń..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                ⚠️ Co było problemem lub przeszkodą?
              </label>
              <input
                type="text"
                value={whatWasProblem}
                onChange={(e) => setWhatWasProblem(e.target.value)}
                placeholder="Np. Kciuk za mocno dociskał górną krawędź przy get-ready..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                🎯 Co poprawić następnym razem?
              </label>
              <input
                type="text"
                value={whatToImprove}
                onChange={(e) => setWhatToImprove(e.target.value)}
                placeholder="Np. Robić 10 powtórzeń w zwolnionym tempie przed lustrem..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                📝 Dodatkowa notatka treningowa
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcjonalne uwagi lub wnioski do zapamiętania..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
            >
              Odrzuć
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Zapisywanie...' : 'Zapisz sesję i odbierz XP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
