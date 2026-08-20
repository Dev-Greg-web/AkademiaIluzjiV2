import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import TechniqueModal from '../components/TechniqueModal';

export default function TechniquesPage() {
  const { selectedTechniqueId, setSelectedTechniqueId, startQuickTraining } = useApp();
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Wszystkie');
  const [selectedStatus, setSelectedStatus] = useState('Wszystkie');

  const categories = [
    'Wszystkie', 'Grips', 'Controls', 'Forces', 'Counts', 'Changes', 
    'False Cuts', 'False Shuffles', 'Palming', 'Sleights', 'Theory'
  ];

  const fetchTechniques = async () => {
    try {
      setLoading(true);
      const data = await api.getTechniques({
        track: 'magic',
        search,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        status: selectedStatus
      });
      setTechniques(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniques();
  }, [search, selectedCategory, selectedDifficulty, selectedStatus]);

  const getStatusTag = (status, mastery) => {
    if (status === 'Mastered+' || mastery >= 90) {
      return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">⭐ MASTER+</span>;
    }
    if (status === 'Mastered' || mastery >= 75) {
      return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">🟢 MASTER</span>;
    }
    if (status === 'Practicing') {
      return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">🔵 W TOKU</span>;
    }
    if (status === 'Started') {
      return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">🟡 START</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold">🔓 ODBLOKOWANE</span>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🃏</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">BIBLIOTEKA MAGIC</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Fundamenty, manipulacje, kontrole, liczenia i zaawansowane sleighty karciane.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj chwytu, techniki lub opisu..."
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Difficulty */}
          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="Wszystkie">Trudność: Wszystkie</option>
              <option value="Beginner">Początkujący (Beginner)</option>
              <option value="Intermediate">Średni (Intermediate)</option>
              <option value="Advanced">Zaawansowany (Advanced)</option>
              <option value="Expert">Ekspert (Expert)</option>
            </select>
          </div>

          {/* Status */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="Wszystkie">Status: Wszystkie</option>
              <option value="Mastered">Mastered (80%+)</option>
              <option value="Practicing">W trakcie nauki</option>
              <option value="Started">Rozpoczęte</option>
              <option value="Unlocked">Odblokowane</option>
            </select>
          </div>

        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                  : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Techniques Grid */}
      {techniques.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techniques.map((tech) => (
            <div
              key={tech.id}
              onClick={() => setSelectedTechniqueId(tech.id)}
              className="bg-[#12131c] hover:bg-[#161726] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {tech.category}
                  </span>
                  {getStatusTag(tech.status, tech.mastery_percentage)}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5">
                  {tech.name}
                </h3>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-4">
                  {tech.description || 'Brak opisu.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-850">
                {/* Mastery Bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400 mb-1">
                    <span>Opanowanie: {tech.mastery_percentage}%</span>
                    <span>{tech.total_reps_count} reps • {tech.training_minutes}m</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${tech.mastery_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1">
                  <span>Trudność: <strong className="text-zinc-200">{tech.difficulty}</strong></span>
                  <span className="text-amber-400 font-semibold group-hover:underline">Szczegóły →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#12131c] border border-zinc-800 rounded-2xl">
          <p className="text-base font-semibold text-zinc-300">Nie znaleziono technik dla podanych filtrów.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('Wszystkie');
              setSelectedDifficulty('Wszystkie');
              setSelectedStatus('Wszystkie');
            }}
            className="mt-3 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl shadow-md"
          >
            Resetuj filtry
          </button>
        </div>
      )}

      {/* Technique Detail Modal */}
      {selectedTechniqueId && (
        <TechniqueModal
          techniqueId={selectedTechniqueId}
          onClose={() => setSelectedTechniqueId(null)}
          onUpdated={fetchTechniques}
        />
      )}

    </div>
  );
}
