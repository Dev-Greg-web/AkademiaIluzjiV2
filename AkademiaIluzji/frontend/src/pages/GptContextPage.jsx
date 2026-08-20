import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  BrainCircuit, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  FileText, 
  Dumbbell, 
  Zap, 
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

const CONTEXT_MODES = [
  {
    id: 'quick',
    label: 'Szybki kontekst',
    icon: Zap,
    desc: 'Zwięzły profil, poziom, aktywne błędy i cele. Idealny do szybkich pytań o technikę.'
  },
  {
    id: 'full',
    label: 'Pełny kontekst',
    icon: FileText,
    desc: 'Kompletny rejestr opanowanych chwytów, rutyn, historii sesji i szczegółowych problemów.'
  },
  {
    id: 'training',
    label: 'Kontekst treningowy',
    icon: Dumbbell,
    desc: 'Skupiony na biomechanice, analizie trudności z ostatnich sesji i generowaniu mikro-drills.'
  },
  {
    id: 'trick',
    label: 'Kontekst do nauki sztuczki',
    icon: Sparkles,
    desc: 'Zestawienie opanowanych technik do doboru pasujących, klasycznych i nowoczesnych rutyn.'
  }
];

export default function GptContextPage() {
  const { showToast } = useApp();
  const [activeMode, setActiveMode] = useState('quick');
  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchContext = async (mode) => {
    try {
      setLoading(true);
      const data = await api.getContext(mode);
      setContextData(data);
    } catch (err) {
      showToast('Błąd generowania kontekstu GPT', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext(activeMode);
  }, [activeMode]);

  const handleCopy = async () => {
    if (!contextData?.context_text) return;
    try {
      await navigator.clipboard.writeText(contextData.context_text);
      setCopied(true);
      showToast('📋 Skopiowano kontekst do schowka! Wklej go do ChatGPT.', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = contextData.context_text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showToast('📋 Skopiowano kontekst do schowka!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleExportTxt = async () => {
    try {
      await api.exportContextTxt(activeMode);
      showToast('💾 Wyeksportowano plik .TXT z kontekstem', 'info');
    } catch (err) {
      showToast('Błąd pobierania pliku .txt', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-semibold">
          <BrainCircuit className="w-4 h-4 text-rose-400" />
          Kluczowa Funkcja • 100% Offline & Bezpieczne
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          🧠 Generator Kontekstu dla ChatGPT
        </h1>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
          Akademia Iluzji <strong>nie potrzebuje API AI ani kluczy</strong>. Wygeneruj poniżej inteligentnie skondensowany kontekst swojej wiedzy, chwytów i problemów, a następnie wklej go ręcznie do ChatGPT jako mentora.
        </p>
      </div>

      {/* 4 Mode Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CONTEXT_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between space-y-3 group ${
                isSelected
                  ? 'bg-rose-950/40 border-rose-600 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                  : 'bg-[#12131b] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${
                  isSelected 
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:text-white'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                )}
              </div>

              <div>
                <h3 className={`font-bold text-sm tracking-tight ${
                  isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                }`}>
                  {mode.label}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-normal mt-1">
                  {mode.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Preview Container */}
      <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-2xl space-y-4">
        {/* Toolbar above preview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {contextData?.title || 'Podgląd Kontekstu'}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {contextData?.char_count || 0} znaków • {contextData?.lines_count || 0} linii tekstu
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportTxt}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-700/80 flex items-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              💾 Eksportuj .TXT
            </button>

            <button
              onClick={handleCopy}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-950/40'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Skopiowano!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  📋 KOPIUJ DO CHATGPT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text Preview Box */}
        <div className="relative">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-zinc-400">Generowanie zoptymalizowanego kontekstu...</p>
            </div>
          ) : (
            <pre className="w-full bg-[#0a0a0f] text-zinc-200 font-mono text-xs p-5 rounded-2xl border border-zinc-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[480px] select-all">
              {contextData?.context_text}
            </pre>
          )}
        </div>
      </div>

      {/* Guide: How to best use this with ChatGPT */}
      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Jak osiągnąć najlepsze rezultaty z ChatGPT?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1.5">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              1. Skopiuj kontekst
            </span>
            <p>Kliknij przycisk „📋 KOPIUJ DO CHATGPT” w wybranym trybie (np. Treningowy lub Pełny).</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1.5">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              2. Wklej na start czatu
            </span>
            <p>Rozpocznij nowy czat w ChatGPT i wklej powyższy tekst jako pierwszą wiadomość.</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1.5">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              3. Pytaj o szczegóły
            </span>
            <p>Zadaj pytanie np.: „Zaproponuj mi 3 ćwiczenia korygujące mój problem z Double Liftem”.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
