import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { profile, activeTab, setActiveTab } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'magic', label: 'Magic', icon: '🃏', badge: profile?.track_levels?.magic?.level ? `Lvl ${profile.track_levels.magic.level}` : null },
    { id: 'cardistry', label: 'Cardistry', icon: '♠️', badge: profile?.track_levels?.cardistry?.level ? `Lvl ${profile.track_levels.cardistry.level}` : null },
    { id: 'performance', label: 'Performance', icon: '🎭', badge: profile?.track_levels?.performance?.level ? `Lvl ${profile.track_levels.performance.level}` : null },
    { id: 'training', label: 'Trening', icon: '🎯' },
    { id: 'quizzes', label: 'Quizy', icon: '🧠' },
    { id: 'progress', label: 'Statystyki', icon: '📈' },
    { id: 'achievements', label: 'Osiągnięcia', icon: '🏆' },
    { id: 'skill-tree', label: 'Skill Tree', icon: '🗺️' },
    { id: 'routines', label: 'Rutyny', icon: '🎪' },
    { id: 'context', label: 'ChatGPT Kontekst', icon: '🤖' },
    { id: 'notes', label: 'Notatki', icon: '📝' },
    { id: 'settings', label: 'Ustawienia', icon: '⚙️' }
  ];

  const handleNav = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const rankTier = profile?.rank_tier || 'Beginner';
  const level = profile?.level_info?.level || profile?.level || 1;
  const rankTitle = profile?.level_info?.title || 'Adept Iluzji';
  const streak = profile?.streak || 0;
  const progressPct = profile?.level_info?.progress_percent || 0;

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d0e15]/95 backdrop-blur-md border-b border-zinc-800/80 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-sm font-bold text-black shadow-md">
            ♠
          </div>
          <div>
            <span className="font-bold tracking-wide text-zinc-100 text-sm block leading-tight">CARD MAGIC</span>
            <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">COACH</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50 text-amber-400">
            <span>🔥</span>
            <span>{streak}d</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700"
            aria-label="Menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0d0e15] border-r border-zinc-800/80 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-amber-600 p-[1px] shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0d0e15] rounded-[11px] flex items-center justify-center">
              <span className="text-lg font-black text-amber-400">♠</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-wider text-white">CARD MAGIC</h1>
            </div>
            <p className="text-[11px] font-semibold tracking-widest text-amber-400 uppercase">COACH</p>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300">Nawigacja</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/10 text-amber-300 border border-amber-500/30 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile Mini Badge at Bottom */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-[#12131c]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'AI'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{profile?.name || 'Adept Iluzji'}</p>
                <p className="text-[10px] text-amber-400 font-medium truncate">{rankTitle} (Lvl {level})</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              <span>🔥</span>
              <span>{streak}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-300 font-medium">
              <span>XP: {profile?.xp || 0}</span>
              <span>{progressPct}% do Lvl {level + 1}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
