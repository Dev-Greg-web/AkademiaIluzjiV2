import React, { useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function TrainingCompletionModal({ isOpen, sessionData, onClose, onSaved }) {
  const { showToast, fireConfetti, refreshProfile } = useApp();
  const [rating, setRating] = useState(8);
  const [scoreControl, setScoreControl] = useState(8);
  const [scoreNaturalness, setScoreNaturalness] = useState(7);
  const [scoreTiming, setScoreTiming] = useState(8);
  const [scoreConfidence, setScoreConfidence] = useState(8);
  const [scorePresentation, setScorePresentation] = useState(7);

  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasProblem, setWhatWasProblem] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [hardestPart, setHardestPart] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ChatGPT Context after session
  const [gptPrompt, setGptPrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const quickTags = ['Tension', 'Timing', 'Grip', 'Naturalness', 'Angles', 'Consistency', 'Confidence'];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        duration_seconds: sessionData?.durationSeconds || 600,
        reps_count: sessionData?.repsCount || 0,
        rating,
        score_control: scoreControl,
        score_naturalness: scoreNaturalness,
        score_timing: scoreTiming,
        score_confidence: scoreConfidence,
        score_presentation: scorePresentation,
        what_went_well: whatWentWell,
        what_was_problem: whatWasProblem,
        what_to_improve: whatToImprove,
        hardest_part: hardestPart,
        problem_tags: selectedTags,
        notes,
        technique_ids: sessionData?.techniqueIds || [],
        session_type: sessionData?.sessionType || 'daily_plan'
      };

      const res = await api.finishTraining(payload);
      fireConfetti();
      showToast(`Trening zapisany! +${res.xp_earned} XP | Streak: ${res.new_streak} dni!`, 'success', res.xp_earned);
      
      // Auto-generate session prompt
      const gptRes = await api.getContext('session_review', res.session);
      setGptPrompt(gptRes.context_text);

      refreshProfile();
      onSaved && onSaved(res);
    } catch (err) {
      showToast('Błąd zapisu sesji: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyGpt = async () => {
    try {
      await navigator.clipboard.writeText(gptPrompt);
      setCopiedPrompt(true);
      showToast('Skopiowano recenzję sesji dla ChatGPT!', 'success');
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch (err) {
      showToast('Błąd kopiowania: ' + err.message, 'error');
    }
  };

  const durationMin = Math.round((sessionData?.durationSeconds || 0) / 60);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#0d0e15] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-wide">PODSUMOWANIE TRENINGU</h3>
              <p className="text-xs text-zinc-300">
                Czas: <strong className="text-amber-400">{durationMin} min</strong> • Powtórzenia: <strong className="text-amber-400">{sessionData?.repsCount || 0}</strong>
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {!gptPrompt ? (
          <form onSubmit={handleFinish} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Main Score Slider */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">
                  OGÓLNA SAMOOCENA SESJI:
                </label>
                <span className="text-lg font-black text-amber-400">{rating} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setRating(v);
                  setScoreControl(v);
                  setScoreNaturalness(v);
                  setScoreTiming(v);
                  setScoreConfidence(v);
                  setScorePresentation(v);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 5 Dimensional Radar Sliders */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">OCENA 5 WYMIARÓW WYKONANIA:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Kontrola i chwyt (Control):</span>
                    <strong className="text-amber-400">{scoreControl}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreControl}
                    onChange={(e) => setScoreControl(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Naturalność (Naturalness):</span>
                    <strong className="text-amber-400">{scoreNaturalness}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreNaturalness}
                    onChange={(e) => setScoreNaturalness(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Timing i tempo (Timing):</span>
                    <strong className="text-amber-400">{scoreTiming}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreTiming}
                    onChange={(e) => setScoreTiming(parseInt(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Pewność siebie (Confidence):</span>
                    <strong className="text-amber-400">{scoreConfidence}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreConfidence}
                    onChange={(e) => setScoreConfidence(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Problem Tags */}
            <div>
              <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1.5">
                Szybkie tagi trudności / błędów do skorygowania:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-sm'
                        : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    [{tag}]
                  </button>
                ))}
              </div>
            </div>

            {/* Hardest Part Input */}
            <div>
              <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">
                Co było najtrudniejsze podczas tej sesji?
              </label>
              <input
                type="text"
                value={hardestPart}
                onChange={(e) => setHardestPart(e.target.value)}
                placeholder="np. Sztywność małego palca przy obrocie..."
                className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* What went well / Reflections */}
            <div>
              <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">
                Wnioski i refleksje:
              </label>
              <textarea
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                placeholder="Co poszło świetnie? Jaki element jest już w pamięci mięśniowej?"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              {saving ? 'Zapisywanie...' : 'Zapisz Sesję i Zaktualizuj Statystyki →'}
            </button>

          </form>
        ) : (
          /* Post-Submission Success Screen with ChatGPT Context Copy */
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-bold text-sm">Sesja została pomyślnie zapisana!</h4>
                  <p className="text-xs text-emerald-200/80">Statystyki, mastery i streak zostały zaktualizowane.</p>
                </div>
              </div>

              <button
                onClick={handleCopyGpt}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  copiedPrompt
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
                }`}
              >
                {copiedPrompt ? '✓ Skopiowano!' : '🤖 Kopiuj Prompt dla ChatGPT'}
              </button>
            </div>

            <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar select-all">
              {gptPrompt}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Zakończ i wróć do Aplikacji
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
