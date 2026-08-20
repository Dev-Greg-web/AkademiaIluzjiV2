import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import RoutineModal from '../components/RoutineModal';

export default function RoutinesPage() {
  const { showToast, fireConfetti, setSelectedTechniqueId, setActiveTab } = useApp();
  const [routines, setRoutines] = useState([]);
  const [generatorData, setGeneratorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeView, setActiveView] = useState('generator'); // 'generator' | 'all'
  const [selectedEffect, setSelectedEffect] = useState('all');

  const effects = [
    { id: 'all', label: 'Wszystkie Efekty' },
    { id: 'ambitious', label: 'Karta Ambitna' },
    { id: 'transposition', label: 'Transpozycja' },
    { id: 'separation', label: 'Separacja (Oliwa & Woda)' },
    { id: 'location', label: 'Lokalizacja / Tryumf' },
    { id: 'color_change', label: 'Zmiana Koloru' }
  ];

  const fetchRoutinesData = async () => {
    try {
      setLoading(true);
      const [allRoutines, genResult] = await Promise.all([
        api.getRoutines(),
        api.getGeneratedRoutines(selectedEffect, 'all')
      ]);
      setRoutines(allRoutines);
      setGeneratorData(genResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutinesData();
  }, [selectedEffect]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎪</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">RUTYNY & GENERATOR</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Klasyczne i autorskie sekwencje karciane. Dopasowane deterministycznie do opanowanego arsenału.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          + Stwórz Własną Rutynę
        </button>
      </div>

      {/* View Switcher & Effect Filters */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeView === 'generator'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-850 text-zinc-400 hover:text-white'
              }`}
            >
              ⚡ Dopasowane do Twoich Chwytów
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeView === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-850 text-zinc-400 hover:text-white'
              }`}
            >
              📚 Cały Repertuar ({routines.length})
            </button>
          </div>

          <select
            value={selectedEffect}
            onChange={(e) => setSelectedEffect(e.target.value)}
            className="bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
          >
            {effects.map(eff => (
              <option key={eff.id} value={eff.id}>{eff.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: DETERMINISTIC MATCHING ROUTINES */}
      {activeView === 'generator' && generatorData && (
        <div className="space-y-8">
          
          {/* Section A: 100% Ready */}
          {generatorData.ready?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <h3 className="text-lg font-bold text-white">Gotowe do Wykonania (100% Znanych Chwytów)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatorData.ready.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoutine(r)}
                    className="bg-[#121b15] border border-emerald-500/40 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer transition-all shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40">
                          100% GOTOWA
                        </span>
                        <span className="text-xs font-bold text-zinc-400">{r.difficulty}</span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1.5">{r.name}</h4>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">{r.effect}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Chwyty: {r.techniques?.join(', ')}</span>
                      <span className="text-emerald-400 font-bold">Otwórz scenariusz →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: 1 Move Away */}
          {generatorData.one_move_away?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟡</span>
                <h3 className="text-lg font-bold text-white">Brakuje Tylko 1 Chwytu (Nearly Ready)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatorData.one_move_away.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoutine(r)}
                    className="bg-[#181712] border border-amber-500/40 hover:border-amber-400 p-5 rounded-2xl cursor-pointer transition-all shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/40">
                          {r.status_label}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">{r.difficulty}</span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1.5">{r.name}</h4>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">{r.effect}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-amber-200/90 font-semibold">
                        Opanuj: {r.missing_techniques?.[0]?.name}
                      </span>
                      <span className="text-amber-400 font-bold">Szczegóły →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: In Development */}
          {generatorData.locked?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className="text-base font-bold text-zinc-400">W Dalszym Planie Rozwoju (2+ chwyty do opanowania)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatorData.locked.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoutine(r)}
                    className="bg-[#12131c] border border-zinc-800/80 p-4 rounded-2xl cursor-pointer opacity-70 hover:opacity-100 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-zinc-300 font-bold block mb-1">{r.difficulty}</span>
                      <h4 className="text-sm font-bold text-zinc-200 mb-1">{r.name}</h4>
                      <p className="text-[11px] text-zinc-300 line-clamp-2">{r.effect}</p>
                    </div>
                    <span className="text-[10px] text-zinc-300 font-semibold block mt-3">
                      Wymaga: {r.missing_techniques?.map(m => m.name).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: ALL ROUTINES */}
      {activeView === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRoutine(r)}
              className="bg-[#12131c] border border-zinc-800 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {r.effect_type || 'Klasyk'}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">{r.difficulty}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5">
                  {r.name}
                </h3>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-4">
                  {r.effect || r.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
                <span>{r.techniques?.length || 0} chwytów</span>
                <span className="text-amber-400 font-semibold group-hover:underline">Zobacz skrypt →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Routine Detail / Create Modal */}
      {(selectedRoutine || showCreateModal) && (
        <RoutineModal
          routine={selectedRoutine}
          isOpen={!!selectedRoutine || showCreateModal}
          onClose={() => {
            setSelectedRoutine(null);
            setShowCreateModal(false);
          }}
          onSaved={fetchRoutinesData}
        />
      )}

    </div>
  );
}
