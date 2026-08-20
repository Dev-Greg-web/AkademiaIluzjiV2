import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function TechniqueModal({ techniqueId, onClose, onUpdated }) {
  const { showToast, startQuickTraining, fireConfetti } = useApp();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('learn'); // learn, practice, master_reqs, problems, notes, videos, gpt
  
  // Problem Form State
  const [newProblemText, setNewProblemText] = useState('');
  const [newProblemPriority, setNewProblemPriority] = useState('Medium');
  const [newProblemTag, setNewProblemTag] = useState('Tension');

  // Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoStage, setVideoStage] = useState('Trening');
  const [videoNotes, setVideoNotes] = useState('');
  const [videoData, setVideoData] = useState('');

  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // GPT Prompt State
  const [gptPrompt, setGptPrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchTech = async () => {
    try {
      setLoading(true);
      const data = await api.getTechnique(techniqueId);
      setTech(data);
      setNoteContent(data.notes || '');

      // Fetch technique gpt context
      const gptRes = await api.getContext('technique_review', data);
      setGptPrompt(gptRes.context_text);
    } catch (err) {
      showToast('Błąd pobierania techniki: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (techniqueId) {
      fetchTech();
    }
  }, [techniqueId]);

  if (!techniqueId) return null;

  const handleToggleChecklist = async (key, currentValue) => {
    try {
      const res = await api.updateMasterChecklist(techniqueId, key, !currentValue);
      setTech(prev => ({
        ...prev,
        master_requirements: res.technique.master_requirements,
        mastery_percentage: res.mastery_percentage,
        status: res.status
      }));
      if (res.status === 'Mastered' || res.status === 'Mastered+') {
        fireConfetti();
        showToast(`Gratulacje! Osiągnięto status ${res.status} w ${tech.name}!`, 'success', 100);
      } else {
        showToast('Zaktualizowano wymaganie', 'info');
      }
      onUpdated && onUpdated();
    } catch (err) {
      showToast('Błąd aktualizacji: ' + err.message, 'error');
    }
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    if (!newProblemText.trim()) return;
    try {
      const prob = await api.addProblem(techniqueId, newProblemText.trim(), newProblemPriority, newProblemTag);
      setTech(prev => ({
        ...prev,
        problems: [prob, ...(prev.problems || [])]
      }));
      setNewProblemText('');
      showToast('Zarejestrowano trudność/błąd do skorygowania', 'warning');
      onUpdated && onUpdated();
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleToggleProblem = async (probId, currentResolved) => {
    try {
      const res = await api.updateProblem(probId, { is_resolved: !currentResolved });
      setTech(prev => ({
        ...prev,
        problems: prev.problems.map(p => p.id === probId ? res.problem : p)
      }));
      if (res.xp_gained > 0) {
        showToast(`Rozwiązano problem! +${res.xp_gained} XP`, 'success', res.xp_gained);
      }
      onUpdated && onUpdated();
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.updateTechnique(techniqueId, { notes: noteContent });
      showToast('Zapisano notatki do techniki', 'success');
      onUpdated && onUpdated();
    } catch (err) {
      showToast('Błąd zapisu notatek: ' + err.message, 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    try {
      await api.saveVideo({
        technique_id: techniqueId,
        title: videoTitle || `Trening ${tech.name}`,
        stage_tag: videoStage,
        notes: videoNotes,
        video_data: videoData
      });
      showToast('Zapisano nagranie wideo! +15 XP', 'success', 15);
      setVideoTitle('');
      setVideoNotes('');
      setVideoData('');
      fetchTech();
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  const handleCopyGptPrompt = async () => {
    try {
      await navigator.clipboard.writeText(gptPrompt);
      setCopiedPrompt(true);
      showToast('Skopiowano prompt do schowka dla ChatGPT!', 'success');
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch (err) {
      showToast('Błąd kopiowania: ' + err.message, 'error');
    }
  };

  const getStatusBadge = (status, mastery) => {
    if (status === 'Mastered+' || mastery >= 90) {
      return <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">⭐ MASTERED+</span>;
    }
    if (status === 'Mastered' || mastery >= 75) {
      return <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">🟢 MASTERED</span>;
    }
    if (status === 'Practicing') {
      return <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">🔵 W TRAKCIE NAUKI</span>;
    }
    if (status === 'Started') {
      return <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">🟡 ROZPOCZĘTO</span>;
    }
    return <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-bold">🔓 ODBLOKOWANE</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 bg-[#0d0e15] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-2xl shadow-inner">
              {tech?.track === 'cardistry' ? '♠️' : (tech?.track === 'performance' ? '🎭' : '🃏')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-wide">{tech?.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {tech?.category}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Trudność: <span className="text-amber-400 font-semibold">{tech?.difficulty}</span> • Poziom Skill Tree: <span className="text-zinc-200 font-bold">{tech?.skill_tree_level}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tech && getStatusBadge(tech.status, tech.mastery_percentage)}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold border border-zinc-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mastery Header Bar */}
        <div className="px-6 py-3 bg-[#151624] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-zinc-300 block text-[10px]">Opanowanie (Mastery):</span>
              <span className="font-extrabold text-sm text-amber-400">{tech?.mastery_percentage || 0}%</span>
            </div>
            <div>
              <span className="text-zinc-300 block text-[10px]">Powtórzenia:</span>
              <span className="font-bold text-zinc-200">{tech?.total_reps_count || 0}</span>
            </div>
            <div>
              <span className="text-zinc-300 block text-[10px]">Czas ćwiczeń:</span>
              <span className="font-bold text-zinc-200">{tech?.training_minutes || 0} min</span>
            </div>
            <div>
              <span className="text-zinc-300 block text-[10px]">Średnia ocena:</span>
              <span className="font-bold text-amber-300">★ {tech?.avg_score || 0}/10</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              startQuickTraining({
                total_minutes: 10,
                plan_items: [{
                  order: 1,
                  technique_id: tech.id,
                  technique_name: tech.name,
                  category: tech.category,
                  duration_minutes: 10,
                  target_reps: 50,
                  focus_note: "Skup się na powolnych, bezbłędnych powtórzeniach.",
                  reason: "Indywidualny trening w studiu"
                }]
              });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <span>🎯</span>
            <span>Ćwicz w Studio</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-[#0d0e15] overflow-x-auto text-xs font-semibold px-4 custom-scrollbar">
          {[
            { id: 'learn', label: '📖 Naucz się' },
            { id: 'master_reqs', label: '⭐ Wymagania Master' },
            { id: 'problems', label: `⚠️ Problemy (${tech?.problems?.filter(p => !p.is_resolved).length || 0})` },
            { id: 'notes', label: '📝 Notatki' },
            { id: 'videos', label: `🎥 Wideo (${tech?.videos?.length || 0})` },
            { id: 'gpt', label: '🤖 ChatGPT Prompt' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* TAB 1: LEARN */}
          {activeTab === 'learn' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">OPIS I MECHANIKA RUCHU</h4>
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  {tech?.description || 'Brak szczegółowego opisu.'}
                </p>
              </div>

              {tech?.notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">WSKAZÓWKI MISTRZA</h4>
                  <div className="text-xs text-amber-200/90 leading-relaxed bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                    💡 {tech.notes}
                  </div>
                </div>
              )}

              {/* Prerequisites & Unlocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase mb-2">WYMAGANE PODSTAWY (PREREQUISITES)</h5>
                  {tech?.prerequisites?.length > 0 ? (
                    <ul className="text-xs space-y-1">
                      {tech.prerequisites.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-zinc-300">
                          <span className="text-amber-400">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-300">Podstawowa technika (Brak wymagań wstępnych)</p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase mb-2">ODBLOKOWUJE NOWE UMIEJĘTNOŚCI</h5>
                  {tech?.unlocks?.length > 0 ? (
                    <ul className="text-xs space-y-1">
                      {tech.unlocks.map((u, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-zinc-300">
                          <span className="text-rose-400">→</span>
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-300">Zaawansowana technika końcowa</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER REQUIREMENTS */}
          {activeTab === 'master_reqs' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">WYMAGANIA DO POZIOMU "MASTER" (80%+)</h4>
                <p className="text-xs text-zinc-300">
                  Status Master jest wyliczany deterministycznie na podstawie powtórzeń, średnich ocen oraz poniższej checklisty.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'lesson_completed', title: 'Ukończona lekcja i poznanie mechaniki', desc: 'Znasz prawidłowe ułożenie palców i sekwencję chwytu.' },
                  { key: 'basic_trained', title: 'Trening podstawowy w studiu', desc: 'Wykonano co najmniej 1 zarejestrowaną sesję.' },
                  { key: 'reps_50', title: 'Minimum 50 poprawnych powtórzeń', desc: `Aktualnie: ${tech?.total_reps_count || 0}/50 powtórzeń.` },
                  { key: 'reps_100', title: 'Minimum 100 powtórzeń dla pamięci mięśniowej', desc: `Aktualnie: ${tech?.total_reps_count || 0}/100 powtórzeń.` },
                  { key: 'score_8', title: 'Średnia samoocena min. 8/10', desc: `Aktualnie: ${tech?.avg_score || 0}/10.` },
                  { key: 'used_in_routine', title: 'Płynne wykonanie w pełnej rutynie', desc: 'Chwyt został z powodzeniem wpleciony w cały trik.' },
                  { key: 'test_passed', title: 'Ukończony test / quiz wiedzy', desc: 'Pozytywny wynik sprawdzianu teorii i wykonania.' }
                ].map((item) => {
                  const isChecked = tech?.master_requirements?.[item.key] || false;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleChecklist(item.key, isChecked)}
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-zinc-200'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${isChecked ? 'text-emerald-300' : 'text-zinc-200'}`}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-300 mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${
                        isChecked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-zinc-700 bg-zinc-800 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PROBLEMS & DIFFICULTIES */}
          {activeTab === 'problems' && (
            <div className="space-y-6">
              {/* Add Problem Form */}
              <form onSubmit={handleAddProblem} className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">ZAPISZ NOWY PROBLEM / BŁĄD</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Kategoria błędu:</label>
                    <select
                      value={newProblemTag}
                      onChange={(e) => setNewProblemTag(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="Tension">Napięcie dłoni (Tension)</option>
                      <option value="Timing">Timing i tempo (Timing)</option>
                      <option value="Grip">Ułożenie palców (Grip)</option>
                      <option value="Naturalness">Brak naturalności (Naturalness)</option>
                      <option value="Angles">Kąty widzenia (Angles)</option>
                      <option value="Confidence">Niepewność ruchu (Confidence)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Priorytet:</label>
                    <select
                      value={newProblemPriority}
                      onChange={(e) => setNewProblemPriority(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="High">Wysoki (Krytyczny błąd)</option>
                      <option value="Medium">Średni</option>
                      <option value="Low">Niski</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Dokładny opis trudności:</label>
                  <input
                    type="text"
                    value={newProblemText}
                    onChange={(e) => setNewProblemText(e.target.value)}
                    placeholder="np. Napinam kciuk przy obracaniu dwóch kart..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Dodaj problem
                </button>
              </form>

              {/* Problems List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">ZAREJESTROWANE WYZWANIA</h4>
                {tech?.problems?.length > 0 ? (
                  tech.problems.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        p.is_resolved
                          ? 'bg-zinc-900/30 border-zinc-850 opacity-60'
                          : 'bg-zinc-900/80 border-zinc-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded ${
                            p.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {p.priority}
                          </span>
                          <span className="text-[10px] text-zinc-300 font-semibold">{p.problem_tag}</span>
                        </div>
                        <p className={`text-xs ${p.is_resolved ? 'line-through text-zinc-300' : 'text-zinc-200'}`}>
                          {p.problem_text}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleProblem(p.id, p.is_resolved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                          p.is_resolved
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {p.is_resolved ? 'Otwórz' : '✓ Rozwiązane'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-300 py-4 text-center">Brak zapisanych problemów. Technika idzie gładko!</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">OSOBISTY DZIENNIK TECHNIKI</h4>
                <p className="text-xs text-zinc-300">Zapisuj własne niuanse, kąty, odkrycia i skojarzenia z treningów.</p>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={8}
                placeholder="Wpisz swoje osobiste spostrzeżenia dotyczące tego chwytu..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 custom-scrollbar leading-relaxed"
              />

              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {savingNote ? 'Zapisywanie...' : 'Zapisz notatki'}
              </button>
            </div>
          )}

          {/* TAB 5: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Add Video Log */}
              <form onSubmit={handleSaveVideo} className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">DODAJ LOKALNE NAGRANIE / WIDEO POSTĘPU</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Tytuł nagrania:</label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="np. Próba 50 powtórzeń..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Etap:</label>
                    <select
                      value={videoStage}
                      onChange={(e) => setVideoStage(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="Przed treningiem">Przed treningiem (Start)</option>
                      <option value="W trakcie nauki">W trakcie nauki</option>
                      <option value="Po 100 powtórzeniach">Po 100 powtórzeniach</option>
                      <option value="Wersja pokazowa">Wersja pokazowa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Notatka / Wnioski z nagrania:</label>
                  <input
                    type="text"
                    value={videoNotes}
                    onChange={(e) => setVideoNotes(e.target.value)}
                    placeholder="np. Widać lekkie napięcie palca wskazującego na klatkach..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Zapisz nagranie (+15 XP)
                </button>
              </form>

              {/* Videos List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">ARCHIWUM NAGRAŃ</h4>
                {tech?.videos?.length > 0 ? (
                  tech.videos.map((v) => (
                    <div key={v.id} className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-zinc-200">{v.title}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {v.stage_tag}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">{v.notes || 'Brak dodatkowych uwag.'}</p>
                        <span className="text-[10px] text-zinc-300 block mt-1">{v.created_at?.slice(0, 16)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-300 py-4 text-center">Brak zapisanych nagrań dla tej techniki.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: GPT PROMPT */}
          {activeTab === 'gpt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">PROMPT DLA CHATGPT O TEJ TECHNICE</h4>
                  <p className="text-xs text-zinc-300">Skopiuj poniższy kontekst i wklej do ChatGPT w celu analizy biomechaniki.</p>
                </div>
                <button
                  onClick={handleCopyGptPrompt}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    copiedPrompt
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-md'
                  }`}
                >
                  {copiedPrompt ? '✓ Skopiowano!' : 'Kopiuj Prompt'}
                </button>
              </div>

              <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto custom-scrollbar select-all">
                {gptPrompt}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
