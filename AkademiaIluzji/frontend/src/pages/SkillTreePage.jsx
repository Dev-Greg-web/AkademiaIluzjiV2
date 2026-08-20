import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import TechniqueModal from '../components/TechniqueModal';

export default function SkillTreePage() {
  const { selectedTechniqueId, setSelectedTechniqueId, startQuickTraining } = useApp();
  const [skillTree, setSkillTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  const fetchSkillTree = async () => {
    try {
      setLoading(true);
      const data = await api.getSkillTree();
      setSkillTree(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillTree();
  }, []);

  const getNodeBadge = (status, mastery) => {
    if (status === 'Mastered+' || mastery >= 90) return '⭐';
    if (status === 'Mastered' || mastery >= 75) return '🟢';
    if (status === 'Practicing') return '🔵';
    if (status === 'Started') return '🟡';
    if (status === 'Unlocked') return '🔓';
    return '🔒';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🗺️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">SKILL TREE ILUZJI</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Drzewo umiejętności od fundamentów po poziom mistrzowski. Kliknij dowolną technikę, aby sprawdzić wymagania i rozpocząć trening.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold bg-[#12131c] px-3.5 py-2 rounded-2xl border border-zinc-800">
          <span className="flex items-center gap-1 text-zinc-400"><span>🔒</span> Zablokowane</span>
          <span className="flex items-center gap-1 text-zinc-300"><span>🔓</span> Dostępne</span>
          <span className="flex items-center gap-1 text-blue-400"><span>🔵</span> W toku</span>
          <span className="flex items-center gap-1 text-emerald-400"><span>🟢</span> Master</span>
          <span className="flex items-center gap-1 text-amber-400"><span>⭐</span> Master+</span>
        </div>
      </div>

      {/* Skill Tree Levels Hierarchy */}
      <div className="space-y-8">
        {skillTree?.levels?.map((lvlGroup) => (
          <div key={lvlGroup.level} className="relative">
            
            {/* Level Tier Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-xs tracking-wider uppercase">
                {lvlGroup.title}
              </div>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lvlGroup.techniques.map((tech) => {
                const isLocked = tech.status === 'Locked';
                const isMastered = tech.status === 'Mastered' || tech.status === 'Mastered+' || tech.mastery_percentage >= 75;
                const badge = getNodeBadge(tech.status, tech.mastery_percentage);

                return (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechniqueId(tech.id)}
                    onMouseEnter={() => setHoveredNode(tech)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                      isMastered
                        ? 'bg-[#151d18] border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/20'
                        : isLocked
                        ? 'bg-zinc-900/40 border-zinc-850 opacity-60 hover:opacity-100 hover:border-zinc-700'
                        : 'bg-[#12131c] border-zinc-800 hover:border-amber-500/50 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700">
                          {tech.category}
                        </span>
                        <span className="text-sm font-bold">{badge}</span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors mb-1">
                        {tech.name}
                      </h4>

                      <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                        {tech.description || 'Brak opisu.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <div className="flex justify-between text-[10px] text-zinc-300 font-semibold mb-1">
                        <span>Mastery:</span>
                        <span className={isMastered ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                          {tech.mastery_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isMastered ? 'bg-emerald-400' : 'bg-amber-500'
                          }`}
                          style={{ width: `${tech.mastery_percentage}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Technique Modal */}
      {selectedTechniqueId && (
        <TechniqueModal
          techniqueId={selectedTechniqueId}
          onClose={() => setSelectedTechniqueId(null)}
          onUpdated={fetchSkillTree}
        />
      )}

    </div>
  );
}
