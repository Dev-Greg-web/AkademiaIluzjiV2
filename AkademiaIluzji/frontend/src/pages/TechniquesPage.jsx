import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import LevelBadge from '../components/LevelBadge';
import TechniqueModal from '../components/TechniqueModal';
import { 
  Search, 
  Filter, 
  Plus, 
  Dumbbell, 
  AlertTriangle, 
  Clock, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal,
  X
} from 'lucide-react';

const CATEGORIES = [
  'Wszystkie',
  'Fundamenty',
  'Controls',
  'Forces',
  'False Cuts',
  'False Shuffles',
  'Counts',
  'Sleights',
  'Cardistry',
  'Flourishes',
  'Performance'
];

const STATUSES = ['Wszystkie', 'Nie rozpoczęto', 'W trakcie', 'Opanowane'];
const DIFFICULTIES = ['Wszystkie', 'Beginner', 'Intermediate', 'Advanced'];

export default function TechniquesPage() {
  const { startQuickTraining, showToast, refreshProfile } = useApp();
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [selectedStatus, setSelectedStatus] = useState('Wszystkie');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Wszystkie');
  const [activeModalId, setActiveModalId] = useState(null);

  // New Technique Form Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Fundamenty');
  const [newDifficulty, setNewDifficulty] = useState('Beginner');
  const [newDesc, setNewDesc] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newLevel, setNewLevel] = useState(0);
  const [creating, setCreating] = useState(false);

  const fetchTechniques = async () => {
    try {
      setLoading(true);
      const data = await api.getTechniques({
        search,
        category: selectedCategory,
        status: selectedStatus,
        difficulty: selectedDifficulty
      });
      setTechniques(data);
    } catch (err) {
      showToast('Błąd pobierania bazy technik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniques();
  }, [search, selectedCategory, selectedStatus, selectedDifficulty]);

  const handleCreateTechnique = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Podaj nazwę techniki', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await api.createTechnique({
        name: newName.trim(),
        category: newCategory,
        difficulty: newDifficulty,
        description: newDesc.trim(),
        notes: newNotes.trim(),
        user_level: Number(newLevel)
      });
      showToast('Dodano nową technikę do bazy!', 'success');
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      setNewNotes('');
      setNewLevel(0);
      fetchTechniques();
      refreshProfile();
    } catch (err) {
      showToast(err.message || 'Błąd tworzenia techniki', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleQuickTrain = (tech, e) => {
    e.stopPropagation();
    startQuickTraining({
      technique_id: tech.id,
      technique_name: tech.name,
      category: tech.category,
      difficulty: tech.difficulty,
      duration_minutes: 15,
      target_reps: 60,
      focus_note: tech.notes || tech.description
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            🃏 Baza Technik Karciarskich
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Zarządzaj swoim arsenałem, monitoruj poziom opanowania (0–10) i eliminuj błędy
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Dodaj własną technikę
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#12131b] border border-zinc-800 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj chwytu (np. Double Lift, Elmsley, Pass)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status & Difficulty Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-rose-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Trudność:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-rose-500"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-zinc-400 font-mono">
            Znaleziono: <strong>{techniques.length}</strong>
          </span>
        </div>
      </div>

      {/* Techniques Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Ładowanie technik...</p>
        </div>
      ) : techniques.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131b] border border-zinc-800 space-y-3">
          <Layers className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Brak technik spełniających kryteria</h3>
          <p className="text-xs text-zinc-400">Zmień filtry lub dodaj nowy chwyt do bazy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techniques.map((tech) => {
            const hasProblems = (tech.unresolved_problems_count || 0) > 0;
            return (
              <div
                key={tech.id}
                onClick={() => setActiveModalId(tech.id)}
                className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg group flex flex-col justify-between space-y-4"
              >
                {/* Top badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition tracking-tight">
                        {tech.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {tech.category}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                          {tech.difficulty}
                        </span>
                      </div>
                    </div>

                    <LevelBadge level={tech.user_level} size="sm" />
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
                    {tech.description || 'Brak opisu.'}
                  </p>
                </div>

                {/* Status bar and actions */}
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono">{tech.training_minutes} min ({tech.sessions_count} sesji)</span>
                    </div>

                    {hasProblems && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        {tech.unresolved_problems_count} błąd
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickTrain(tech, e)}
                    className="w-full py-2 bg-zinc-900 hover:bg-rose-600 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 hover:border-rose-500 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    Trenuj tę technikę
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Technique Modal */}
      {activeModalId && (
        <TechniqueModal
          techniqueId={activeModalId}
          onClose={() => setActiveModalId(null)}
          onTechniqueUpdated={fetchTechniques}
        />
      )}

      {/* Add Custom Technique Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111219] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 bg-[#151622] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dodaj nową technikę
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTechnique} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Nazwa techniki *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Np. Diagonal Palm Shift, Tilt..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Kategoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Wszystkie').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Poziom trudności
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Początkowy poziom opanowania (0-10): <span className="text-rose-400 font-bold">{newLevel}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full h-2 bg-zinc-800 rounded-lg accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Opis techniki
                </label>
                <textarea
                  rows={2}
                  placeholder="Krótki opis działania i zastosowania..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Wskazówki i notatki
                </label>
                <textarea
                  rows={2}
                  placeholder="Wskazówki dotyczące chwytu, kątów..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Anuluj
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {creating ? 'Zapisywanie...' : 'Dodaj technikę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
