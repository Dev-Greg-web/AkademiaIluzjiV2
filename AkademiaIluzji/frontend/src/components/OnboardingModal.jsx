import React, { useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function OnboardingModal({ isOpen, onClose }) {
  const { refreshProfile, showToast, fireConfetti, startQuickTraining } = useApp();
  const [step, setStep] = useState(1);
  const [startingLevel, setStartingLevel] = useState('Beginner');
  const [focusTrack, setFocusTrack] = useState('all');
  const [preferredMinutes, setPreferredMinutes] = useState(20);
  const [knownTechniques, setKnownTechniques] = useState([
    'Mechanics Grip', 'Overhand Shuffle'
  ]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const standardStarters = [
    { name: 'Mechanics Grip', track: 'Magic', desc: 'Podstawowy chwyt talii' },
    { name: 'Overhand Shuffle', track: 'Magic', desc: 'Klasyczne tasowanie w dłoniach' },
    { name: 'Riffle Shuffle', track: 'Magic', desc: 'Przeplatanie narożników kart' },
    { name: 'Swing Cut', track: 'Magic', desc: 'Obrotowe przełożenie pakietu' },
    { name: 'Double Lift', track: 'Magic', desc: 'Podnoszenie 2 kart jako 1' },
    { name: 'Double Undercut', track: 'Magic', desc: 'Kontrola wybranej karty na wierzch' },
    { name: 'Basic Fan', track: 'Cardistry', desc: 'Rozłożenie talii w półkolisty wachlarz' },
    { name: 'Charlier Cut', track: 'Cardistry', desc: 'Jednoręczne cięcie talii' },
    { name: 'Eye Contact & Posture', track: 'Performance', desc: 'Kontakt wzrokowy z widzem' },
    { name: 'Timing Basics', track: 'Performance', desc: 'Wyczucie momentu rozluźnienia uwagi' }
  ];

  const toggleTechnique = (name) => {
    if (knownTechniques.includes(name)) {
      setKnownTechniques(knownTechniques.filter(t => t !== name));
    } else {
      setKnownTechniques([...knownTechniques, name]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.completeOnboarding({
        starting_level: startingLevel,
        focus_track: focusTrack,
        preferred_minutes: preferredMinutes,
        known_techniques: knownTechniques
      });
      await refreshProfile();
      fireConfetti();
      showToast('Witaj w CARD MAGIC COACH! Twój plan jest gotowy.', 'success', 50);
      onClose();
    } catch (err) {
      showToast('Błąd zapisu preferencji: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12131c] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Progress Bar & Header */}
        <div className="p-6 border-b border-zinc-800 bg-[#0d0e15]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">♠️</span>
              <h2 className="text-lg font-bold text-white tracking-wide">KREATOR PROFILU COACHA</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Krok {step} z 4
            </span>
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* STEP 1: Starting Level */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">1. Jaki jest Twój aktualny poziom zaawansowania?</h3>
                <p className="text-xs text-zinc-300 mt-1">Dopasujemy trudność rekomendowanych technik i tempo nauki.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'Beginner', title: 'Początkujący (Beginner)', desc: 'Dopiero zaczynam lub znam tylko 1-2 podstawowe triki bez trudnych sleightów.' },
                  { id: 'Intermediate', title: 'Średniozaawansowany (Intermediate)', desc: 'Pewnie trzymam talię, znam Double Lift, podstawowe kontrole i chcę płynności.' },
                  { id: 'Advanced', title: 'Zaawansowany (Advanced)', desc: 'Znam zaawansowane liczenia (Elmsley), palming, buduję pełne rutyny pokazowe.' }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setStartingLevel(tier.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      startingLevel === tier.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                        : 'bg-zinc-850/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-amber-300">{tier.title}</span>
                      {startingLevel === tier.id && <span className="text-amber-400 font-bold">✓</span>}
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Focus Track */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">2. Na czym chcesz się skupić najbardziej?</h3>
                <p className="text-xs text-zinc-300 mt-1">Wybierz główną ścieżkę lub rozwijaj wszystkie równolegle.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'all', icon: '🌟', title: 'Wszystkie 3 Ścieżki', desc: 'Harmonijny rozwój magii, florystycznych cięć i gry aktorskiej' },
                  { id: 'magic', icon: '🃏', title: 'Tylko Magia Karciana', desc: 'Chwyty, sekrety, zmyłki i budowanie repertuaru trików' },
                  { id: 'cardistry', icon: '♠️', title: 'Głównie Cardistry', desc: 'Wachlarze, jednoręczne cięcia, rozkładania i kaskady' },
                  { id: 'performance', icon: '🎭', title: 'Performance & Psychologia', desc: 'Timing, mowa ciała, misdirection i kontakt z widownią' }
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setFocusTrack(track.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      focusTrack === track.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                        : 'bg-zinc-850/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{track.icon}</div>
                    <p className="font-bold text-sm text-zinc-200">{track.title}</p>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-snug">{track.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Daily Target Minutes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">3. Ile czasu dziennie chcesz poświęcać na trening?</h3>
                <p className="text-xs text-zinc-300 mt-1">Nawet 10-15 minut codziennie buduje niezwykłą pamięć mięśniową.</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setPreferredMinutes(mins)}
                    className={`py-3 px-2 rounded-xl border text-center font-bold text-sm transition-all ${
                      preferredMinutes === mins
                        ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-black border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-850/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Known Techniques Checklist */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">4. Zaznacz techniki, które już znasz lub ćwiczyłeś:</h3>
                <p className="text-xs text-zinc-300 mt-1">Te techniki natychmiast oznaczymy jako odblokowane w Twoim Skill Tree.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {standardStarters.map((t) => {
                  const isChecked = knownTechniques.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      onClick={() => toggleTechnique(t.name)}
                      className={`p-2.5 rounded-lg border text-left flex items-start justify-between transition-all ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500/50 text-white'
                          : 'bg-zinc-850/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-zinc-200">{t.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">{t.track}</span>
                        </div>
                        <p className="text-[10px] text-zinc-300 truncate mt-0.5">{t.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-[10px] font-bold border ${
                        isChecked ? 'bg-amber-500 border-amber-400 text-black' : 'border-zinc-700 bg-zinc-800'
                      }`}>
                        {isChecked ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-zinc-800 bg-[#0d0e15] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-700"
            >
              ← Wstecz
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-300"
            >
              Pomiń konfigurację
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Dalej →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              {saving ? 'Konfigurowanie...' : '✨ Rozpocznij Trening!'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
