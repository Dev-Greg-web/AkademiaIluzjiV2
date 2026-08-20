import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AchievementsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.getAchievements();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const categories = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'training', label: 'Trening & Sesje' },
    { id: 'mastery', label: 'Mistrzostwo Chwytów' },
    { id: 'streak', label: 'Dyscyplina & Streak' },
    { id: 'cardistry', label: 'Cardistry' },
    { id: 'performance', label: 'Performance' },
    { id: 'quizzes', label: 'Quizy' }
  ];

  const filteredList = data?.achievements?.filter(a => {
    if (selectedCat === 'all') return true;
    return a.category === selectedCat;
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">OSIĄGNIĘCIA I ODZNAKI</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Kamienie milowe w drodze do mistrzostwa iluzji karcianej.
          </p>
        </div>

        {/* Global Progress */}
        <div className="bg-[#12131c] px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-4">
          <div>
            <span className="text-[10px] text-zinc-300 block">Odblokowano:</span>
            <span className="text-base font-extrabold text-amber-400">
              {data?.unlocked_count || 0} / {data?.total_count || 0}
            </span>
          </div>
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${data?.completion_rate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedCat === cat.id
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((ach) => {
          const isUnlocked = ach.unlocked === 1;
          const progressPct = Math.min(100, Math.round(((ach.current_progress || 0) / (ach.required_count || 1)) * 100));

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-[#151a22] border-amber-500/40 shadow-lg shadow-amber-950/10'
                  : 'bg-[#12131c] border-zinc-800/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{ach.icon}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isUnlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {isUnlocked ? 'ODBLOKOWANE' : `+${ach.xp_reward} XP`}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-white mb-1">{ach.title}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed mb-4">{ach.description}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                  <span>Postęp:</span>
                  <span>{ach.current_progress || 0} / {ach.required_count} ({progressPct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-amber-400' : 'bg-zinc-600'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {isUnlocked && ach.unlocked_at && (
                  <span className="text-[9px] text-zinc-300 block text-right pt-0.5">
                    Zdobyto: {ach.unlocked_at?.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
