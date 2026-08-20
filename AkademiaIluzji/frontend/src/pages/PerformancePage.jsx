import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function PerformancePage() {
  const { profile, showToast, fireConfetti, refreshProfile } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form State
  const [routineName, setRoutineName] = useState('Ambitious Card (Karta Ambitna)');
  const [venue, setVenue] = useState('Znajomi / Kameralnie');
  const [audienceReaction, setAudienceReaction] = useState('Duże zaskoczenie i brawa');
  const [overallScore, setOverallScore] = useState(8);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    patter: true,
    timing: true,
    misdirection: false,
    eye_contact: true,
    body_language: true,
    confidence: true,
    ending: true,
    reset: false
  });

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const data = await api.getPerformanceSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const toggleChecklistItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRecordPerformance = async (e) => {
    e.preventDefault();
    try {
      const res = await api.recordPerformanceSession({
        routine_name: routineName,
        venue,
        audience_reaction: audienceReaction,
        overall_score: overallScore,
        checklist,
        what_worked: whatWorked,
        what_to_improve: whatToImprove,
        notes
      });
      fireConfetti();
      showToast(`Zarejestrowano występ sceniczny! +${res.xp_gained} XP`, 'success', res.xp_gained);
      setShowLogModal(false);
      refreshProfile();
      fetchPerformance();
    } catch (err) {
      showToast('Błąd: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎭</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">PERFORMANCE & SCENA</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Psychologia magii, misdirection, timing, narracja (patter) i sztuka kontaktu z publicznością.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>✨</span>
          <span>Zarejestruj Występ / Pokaz</span>
        </button>
      </div>

      {/* 8 Core Pillars of Performance Cards */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>🏛️</span>
          <span>8 Filarów Prezentacji Scenicznej</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🗣️', title: 'Patter & Skrypt', desc: 'Spójna, intrygująca narracja bez pustych słów' },
            { icon: '⏱️', title: 'Timing & Off-Beat', desc: 'Wykonywanie sleightu na wydechu uwagi widza' },
            { icon: '👁️', title: 'Misdirection', desc: 'Świadome kierowanie uwagą za pomocą spojrzenia' },
            { icon: '🤝', title: 'Eye Contact', desc: 'Budowanie bezpośredniej relacji i zaufania' },
            { icon: '🕺', title: 'Mowa Ciała', desc: 'Zrelaksowana postawa bez zdradzania napięcia' },
            { icon: '🦁', title: 'Pewność Siebie', desc: 'Poczucie pełnej kontroli nad przestrzenią' },
            { icon: '💥', title: 'Mocna Puenta', desc: 'Eskalacja niemożliwości i czysty climax' },
            { icon: '🔄', title: 'Błyskawiczny Reset', desc: 'Gotowość do powtórzenia w ułamku sekundy' }
          ].map((pillar, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xl block mb-1">{pillar.icon}</span>
              <p className="font-bold text-xs text-zinc-200">{pillar.title}</p>
              <p className="text-[10px] text-zinc-300 mt-0.5 leading-snug">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Past Performance Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📜</span>
            <span>Dziennik Występów na Żywo ({sessions.length})</span>
          </h3>
        </div>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div key={s.id} className="bg-[#12131c] border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-100">{s.routine_name}</h4>
                    <p className="text-[11px] text-zinc-300">{s.venue} • {s.created_at?.slice(0, 16)}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    ★ {s.overall_score}/10
                  </span>
                </div>

                <div className="text-xs text-zinc-300 space-y-1 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <p><strong className="text-zinc-200">Reakcja widza:</strong> {s.audience_reaction}</p>
                  {s.what_worked && <p><strong className="text-emerald-400">Co zadziałało:</strong> {s.what_worked}</p>}
                  {s.what_to_improve && <p><strong className="text-rose-400">Wnioski:</strong> {s.what_to_improve}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#12131c] border border-zinc-800 rounded-2xl">
            <p className="text-xs text-zinc-300">Brak zarejestrowanych występów na żywo. Zaprezentuj trik znajomym i zanotuj wnioski!</p>
          </div>
        )}
      </div>

      {/* Record Performance Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12131c] border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            
            <div className="p-5 border-b border-zinc-800 bg-[#0d0e15] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <h3 className="font-bold text-sm text-white">REJESTRACJA WYSTĘPU NA ŻYWO</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPerformance} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Prezentowana Rutyna:</label>
                  <input
                    type="text"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Miejsce / Widzowie:</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="np. Rodzina przy stole, pub..."
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1.5">Checklista Sceniczna:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'patter', label: 'Patter & Historia' },
                    { key: 'timing', label: 'Timing & Pauzy' },
                    { key: 'misdirection', label: 'Czysty Misdirection' },
                    { key: 'eye_contact', label: 'Kontakt Wzrokowy' },
                    { key: 'body_language', label: 'Zrelaksowane Dłonie' },
                    { key: 'confidence', label: 'Pewność Siebie' },
                    { key: 'ending', label: 'Wyrazista Puenta' },
                    { key: 'reset', label: 'Cichy Reset' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleChecklistItem(item.key)}
                      className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                        checklist[item.key]
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span>{checklist[item.key] ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Reakcja i emocje widowni:</label>
                <input
                  type="text"
                  value={audienceReaction}
                  onChange={(e) => setAudienceReaction(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Ocena ogólna (1-10):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={overallScore}
                    onChange={(e) => setOverallScore(parseInt(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-extrabold text-amber-400 w-8 text-center">{overallScore}/10</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Co zadziałało najlepiej?</label>
                <input
                  type="text"
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  placeholder="np. Zaskoczenie przy zmianie koloru karty..."
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Co warto poprawić następnym razem?</label>
                <input
                  type="text"
                  value={whatToImprove}
                  onChange={(e) => setWhatToImprove(e.target.value)}
                  placeholder="np. Zrobić dłuższą pauzę przed odwróceniem..."
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
                >
                  Zapisz występ (+40 XP)
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
