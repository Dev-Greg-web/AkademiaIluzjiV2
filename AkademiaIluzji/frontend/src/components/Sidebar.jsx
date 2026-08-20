import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Layers, 
  Sparkles, 
  Flame, 
  Dumbbell, 
  BarChart3, 
  BrainCircuit, 
  StickyNote, 
  Settings, 
  Menu, 
  X,
  Award,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'techniques', label: 'Techniki', icon: Layers },
  { id: 'routines', label: 'Rutyny', icon: Sparkles },
  { id: 'training', label: 'Trening', icon: Dumbbell },
  { id: 'progress', label: 'Postęp', icon: BarChart3 },
  { id: 'context', label: 'GPT Context', icon: BrainCircuit, badge: 'PROMPT' },
  { id: 'notes', label: 'Notatki', icon: StickyNote },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
];

export default function Sidebar() {
  const { profile, activeTab, setActiveTab } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const levelInfo = profile?.level_info || {
    level: 1,
    title: 'Adept Iluzji',
    total_xp: 0,
    progress_percent: 0,
    xp_needed: 100
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0d0e14] border-r border-zinc-800/80 text-zinc-300">
      {/* App Header */}
      <div className="p-6 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center shadow-lg shadow-rose-950/40 text-white font-bold text-xl border border-rose-500/30">
            ♠
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-lg flex items-center gap-1.5">
              Akademia Iluzji
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Sleight of Hand Studio</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isGpt = item.id === 'context';

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? isGpt
                    ? 'bg-rose-950/50 text-rose-300 border border-rose-600/40 shadow-lg shadow-rose-950/30'
                    : 'bg-zinc-800/90 text-white border border-zinc-700/60 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? isGpt
                        ? 'text-rose-400'
                        : 'text-rose-500'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Level, XP & Streak Status Card */}
      <div className="p-4 border-t border-zinc-800/60 bg-[#090a0f]">
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 shadow-inner">
          {/* Level Header & Streak */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center">
                {levelInfo.level}
              </span>
              <div>
                <p className="text-xs font-bold text-white leading-none">
                  {levelInfo.title}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                  {profile?.xp || 0} XP
                </p>
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold" title="Dni treningu z rzędu">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{profile?.streak || 0}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1 mt-2.5">
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${levelInfo.progress_percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>{levelInfo.progress_percent}%</span>
              <span>{levelInfo.xp_needed > 0 ? `+${levelInfo.xp_needed} do Lv ${levelInfo.level + 1}` : 'MAX'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#0d0e14] border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
            ♠
          </div>
          <span className="font-bold text-white text-base">Akademia Iluzji</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen fixed top-0 left-0 flex-col z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-4/5 max-w-xs h-full bg-[#0d0e14] z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
