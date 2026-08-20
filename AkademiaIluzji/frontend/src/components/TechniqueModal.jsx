import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import LevelBadge from './LevelBadge';
import { 
  X, 
  Dumbbell, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles,
  Save
} from 'lucide-react';

export default function TechniqueModal({ techniqueId, onClose, onTechniqueUpdated }) {
  const { showToast, fireConfetti, refreshProfile, startQuickTraining } = useApp();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userLevel, setUserLevel] = useState(0);
  const [notesText, setNotesText] = useState('');
  const [newProblemText, setNewProblemText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchTechDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getTechnique(techniqueId);
      setTech(data);
      setUserLevel(data.user_level || 0);
      setNotesText(data.notes || '');
    } catch (err) {
      showToast('Nie udało się załadować techniki', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (techniqueId) {
      fetchTechDetails();
    }
  }, [techniqueId]);

  const handleLevelChange = async (newLevel) => {
    const val = Number(newLevel);
    setUserLevel(val);
    try {
      const res = await api.updateTechniqueLevel(techniqueId, val);
      setTech((prev) => ({
        ...prev,
        user_level: val,
        status: res.technique.status
      }));
      if (res.xp_gained > 0) {
        showToast(`Zwiększono poziom opanowania! +${res.xp_gained} XP`, 'success', res.xp_gained);
        fireConfetti();
      } else {
        showToast(`Zaktualizowano poziom: ${val}/10`, 'info');
      }
      refreshProfile();
      if (onTechniqueUpdated) onTechniqueUpdated();
    } catch (err) {
      showToast('Błąd aktualizacji poziomu', 'error');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await api.updateTechnique(techniqueId, { notes: notesText });
      showToast('Zapisano notatki do techniki', 'success');
      if (onTechniqueUpdated) onTechniqueUpdated();
    } catch (err) {
      showToast('Błąd zapisu notatek', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    if (!newProblemText.trim()) return;
    try {
      const res = await api.addProblem(techniqueId, newProblemText.trim());
      setTech((prev) => ({
        ...prev,
        problems: [res, ...(prev.problems || [])]
      }));
      setNewProblemText('');
      showToast('Dodano problem do rejestru', 'info');
      if (onTechniqueUpdated) onTechniqueUpdated();
    } catch (err) {
      showToast('Błąd dodawania problemu', 'error');
    }
  };

  const handleToggleProblem = async (problemId, currentResolved) => {
    try {
      const newStatus = currentResolved === 1 ? 0 : 1;
      const res = await api.updateProblem(problemId, { is_resolved: newStatus });
      setTech((prev) => ({
        ...prev,
        problems: prev.problems.map((p) => (p.id === problemId ? res.problem : p))
      }));
      if (res.xp_gained > 0) {
        showToast(`Problem rozwiązany! +${res.xp_gained} XP`, 'success', res.xp_gained);
        fireConfetti();
        refreshProfile();
      } else {
        showToast('Zmieniono status problemu', 'info');
      }
      if (onTechniqueUpdated) onTechniqueUpdated();
    } catch (err) {
      showToast('Błąd aktualizacji problemu', 'error');
    }
  };

  const handleDeleteProblem = async (problemId) => {
    try {
      await api.deleteProblem(problemId);
      setTech((prev) => ({
        ...prev,
        problems: prev.problems.filter((p) => p.id !== problemId)
      }));
      showToast('Usunięto problem', 'info');
      if (onTechniqueUpdated) onTechniqueUpdated();
    } catch (err) {
      showToast('Błąd usuwania problemu', 'error');
    }
  };

  const handleStartTrainingThis = () => {
    if (!tech) return;
    onClose();
    startQuickTraining({
      technique_id: tech.id,
      technique_name: tech.name,
      category: tech.category,
      difficulty: tech.difficulty,
      duration_minutes: 15,
      target_reps: 100,
      focus_note: tech.notes || tech.description
    });
  };

  if (!techniqueId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111219] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between bg-[#151622]">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-48 bg-zinc-800 rounded" />
              <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{tech?.name}</h2>
                <LevelBadge level={tech?.user_level} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {tech?.category}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/40">
                  {tech?.difficulty}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-zinc-400">Ładowanie szczegółów techniki...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Level Slider Bar Card */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-200">
                  Mój poziom opanowania: <span className="text-rose-400 font-bold font-mono text-base">{userLevel}/10</span>
                </label>
                <span className="text-xs text-zinc-400">
                  {userLevel >= 8 ? '🟢 Pełna swoboda (Master)' : userLevel >= 1 ? '🟡 W trakcie nauki' : '🔒 Nie rozpoczęto'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={userLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>0 (Start)</span>
                <span>5 (Płynnie)</span>
                <span>8 (Master)</span>
                <span>10 (Perfekcja)</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <Clock className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">Łączny czas</p>
                  <p className="text-sm font-bold text-white font-mono">{tech.training_minutes} min</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">Liczba sesji</p>
                  <p className="text-sm font-bold text-white font-mono">{tech.sessions_count}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-zinc-400">Ostatni trening</p>
                  <p className="text-xs font-bold text-white font-mono truncate">
                    {tech.last_trained_at ? tech.last_trained_at.slice(0, 10) : 'Nigdy'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Opis techniki</h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                {tech.description || 'Brak opisu.'}
              </p>
            </div>

            {/* Problems Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Moje problemy i wyzwania ({tech.problems?.length || 0})
                </h3>
              </div>

              {/* Add Problem Form */}
              <form onSubmit={handleAddProblem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Np. Karty rozjeżdżają się przy obrocie..."
                  value={newProblemText}
                  onChange={(e) => setNewProblemText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj
                </button>
              </form>

              {/* Problems List */}
              <div className="space-y-2">
                {tech.problems && tech.problems.length > 0 ? (
                  tech.problems.map((prob) => (
                    <div
                      key={prob.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm transition ${
                        prob.is_resolved
                          ? 'bg-emerald-950/20 border-emerald-800/30 text-zinc-400 line-through'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleProblem(prob.id, prob.is_resolved)}
                        className="flex items-center gap-2.5 text-left flex-1 group"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 transition ${
                            prob.is_resolved
                              ? 'text-emerald-400 fill-emerald-400/20'
                              : 'text-zinc-600 group-hover:text-emerald-400'
                          }`}
                        />
                        <span className={prob.is_resolved ? 'opacity-70' : 'font-medium'}>
                          {prob.problem_text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProblem(prob.id)}
                        className="text-zinc-400 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">Brak zapisanych problemów. Wszystko idzie gładko!</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Notatki i własne spostrzeżenia
                </h3>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingNotes ? 'Zapisywanie...' : 'Zapisz notatki'}
                </button>
              </div>
              <textarea
                rows={3}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Wpisz wskazówki dotyczące ułożenia palców, kątów lub momentu wykonania..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#151622] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition font-medium"
          >
            Zamknij
          </button>

          <button
            onClick={handleStartTrainingThis}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95"
          >
            <Dumbbell className="w-4 h-4" />
            Trenuj tę technikę
          </button>
        </div>
      </div>
    </div>
  );
}
