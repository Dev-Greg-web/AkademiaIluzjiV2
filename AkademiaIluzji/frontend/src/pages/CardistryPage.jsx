import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import TechniqueModal from '../components/TechniqueModal';

export default function CardistryPage() {
  const { selectedTechniqueId, setSelectedTechniqueId, profile } = useApp();
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const categories = ['Wszystkie', 'Cuts', 'Fans', 'Spreads', 'Packets', 'Flourishes', 'Combos', 'Displays', 'Advanced Moves'];

  const fetchCardistry = async () => {
    try {
      setLoading(true);
      const data = await api.getTechniques({
        track: 'cardistry',
        category: selectedCategory
      });
      setTechniques(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardistry();
  }, [selectedCategory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">♠️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">CARDISTRY STUDIO</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Wachlarze, jednoręczne cięcia, wielopakietowe kombinacje, kaskady i florystyczna estetyka.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#12131c] px-4 py-2.5 rounded-2xl border border-zinc-800">
          <span className="text-xs font-medium text-zinc-300">Poziom Cardistry:</span>
          <span className="text-sm font-extrabold text-rose-400">
            Lvl {profile?.track_levels?.cardistry?.level || 1}
          </span>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cardistry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techniques.map((tech) => (
          <div
            key={tech.id}
            onClick={() => setSelectedTechniqueId(tech.id)}
            className="bg-[#12131c] hover:bg-[#161726] border border-zinc-800/80 hover:border-rose-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {tech.category}
                </span>
                <span className="text-[10px] font-bold text-zinc-400">
                  Poziom {tech.skill_tree_level}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors mb-1.5">
                {tech.name}
              </h3>

              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-4">
                {tech.description || 'Brak opisu.'}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-850">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-zinc-400 mb-1">
                  <span>Płynność (Mastery): {tech.mastery_percentage}%</span>
                  <span>{tech.total_reps_count} reps</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${tech.mastery_percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1">
                <span>Trudność: <strong className="text-zinc-200">{tech.difficulty}</strong></span>
                <span className="text-rose-400 font-semibold group-hover:underline">Szczegóły →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Technique Modal */}
      {selectedTechniqueId && (
        <TechniqueModal
          techniqueId={selectedTechniqueId}
          onClose={() => setSelectedTechniqueId(null)}
          onUpdated={fetchCardistry}
        />
      )}

    </div>
  );
}
