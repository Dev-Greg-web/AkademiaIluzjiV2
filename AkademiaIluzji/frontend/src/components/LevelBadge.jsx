import React from 'react';

export default function LevelBadge({ level, showText = true, size = 'md' }) {
  const num = Number(level) || 0;

  let colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  let label = 'Nie rozpoczęto';

  if (num >= 8) {
    colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/20';
    label = 'Opanowane';
  } else if (num >= 4) {
    colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    label = 'W trakcie';
  } else if (num >= 1) {
    colorClass = 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    label = 'Początek';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${colorClass} ${sizeClasses[size] || sizeClasses.md}`}>
      <span className="font-mono">{num}/10</span>
      {showText && <span className="opacity-80 font-normal">({label})</span>}
    </div>
  );
}
