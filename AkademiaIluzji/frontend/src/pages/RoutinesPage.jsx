import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import RoutineModal from '../components/RoutineModal';
import { 
  Sparkles, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Layers, 
  MessageSquare, 
  FileText,
  Eye
} from 'lucide-react';

export default function RoutinesPage() {
  const { startQuickTraining, showToast } = useApp();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await api.getRoutines();
      setRoutines(data);
    } catch (err) {
      showToast('Błąd pobierania rutyn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleCreateNew = () => {
    setEditingRoutine(null);
    setModalOpen(true);
  };

  const handleEdit = (r) => {
    setEditingRoutine(r);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę rutynę?')) return;
    try {
      await api.deleteRoutine(id);
      showToast('Usunięto rutynę', 'info');
      fetchRoutines();
    } catch (err) {
      showToast('Błąd usuwania rutyny', 'error');
    }
  };

  const handlePracticeRoutine = (r) => {
    startQuickTraining({
      technique_name: r.name,
      duration_minutes: 25,
      target_reps: 15,
      focus_note: `Trening pełnej rutyny: ${r.effect || r.name}. Zwróć uwagę na płynność przejść i skrypt narracji.`
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            🎭 Moje Rutyny Magiczne
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Projektuj kompletne sekwencje trików, rozwijaj patter (narrację) i szlifuj prezentację sceniczną
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Stwórz nową rutynę
        </button>
      </div>

      {/* Routines Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Ładowanie rutyn...</p>
        </div>
      ) : routines.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131b] border border-zinc-800 space-y-3">
          <Sparkles className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Brak stworzonych rutyn</h3>
          <p className="text-xs text-zinc-400">Kliknij przycisk powyżej, aby stworzyć swoją pierwszą kompletną sekwencję!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routines.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-5 shadow-xl group"
            >
              <div className="space-y-4">
                {/* Title & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/40 font-mono">
                      {r.difficulty || 'Intermediate'}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition tracking-tight mt-1.5">
                      {r.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      title="Edytuj rutynę"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                      title="Usuń rutynę"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Effect */}
                {r.effect && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Efekt dla widza:
                    </span>
                    <p className="text-zinc-200 leading-relaxed font-medium">
                      {r.effect}
                    </p>
                  </div>
                )}

                {/* Techniques Flow Steps */}
                {r.techniques && r.techniques.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-sky-400" />
                      Sekwencja chwytów:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.techniques.map((tName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-700/80"
                        >
                          <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {tName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patter Script */}
                {r.patter && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-amber-400" />
                      Patter / Skrypt narracji:
                    </span>
                    <p className="text-xs text-zinc-300 italic bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40 leading-relaxed">
                      {r.patter}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {r.techniques?.length || 0} chwytów w sekwencji
                </span>

                <button
                  onClick={() => handlePracticeRoutine(r)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 hover:border-rose-500 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Trenuj tę rutynę
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Routine Creator/Editor Modal */}
      <RoutineModal
        isOpen={modalOpen}
        routine={editingRoutine}
        onClose={() => setModalOpen(false)}
        onSaved={fetchRoutines}
      />
    </div>
  );
}
