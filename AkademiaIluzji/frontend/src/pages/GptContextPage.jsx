import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function GptContextPage() {
  const { showToast } = useApp();
  const [selectedType, setSelectedType] = useState('quick');
  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const contextTypes = [
    { id: 'quick', title: 'Szybki Kontekst', desc: 'Poziom, cele, główne błędy i stan opanowania' },
    { id: 'full', title: 'Kompletny Raport Coacha', desc: 'Pełny arsenał chwytów, rutyny i głęboka biomechanika' },
    { id: 'training', title: 'Trening & Spaced Repetition', desc: 'Analiza technik wymagających powtórki i plan mikro-drills' },
    { id: 'trick', title: 'Dobór Nowej Sztuczki', desc: 'Propozycja rutyn pasujących ściśle do znanych chwytów' },
    { id: 'performance_review', title: 'Recenzja Występu & Patter', desc: 'Udoskonalenie skryptu narracji i psychologii misdirection' }
  ];

  const fetchContext = async (type) => {
    try {
      setLoading(true);
      const res = await api.getContext(type);
      setContextData(res);
    } catch (err) {
      showToast('Błąd pobierania kontekstu: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext(selectedType);
  }, [selectedType]);

  const handleCopy = async () => {
    if (!contextData?.context_text) return;
    try {
      await navigator.clipboard.writeText(contextData.context_text);
      setCopied(true);
      showToast('Skopiowano kontekst dla ChatGPT do schowka!', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      showToast('Błąd kopiowania: ' + err.message, 'error');
    }
  };

  const handleDownloadTxt = async () => {
    try {
      await api.exportContextTxt(selectedType);
      showToast('Pobrano plik tekstowy z promptem!', 'success');
    } catch (err) {
      showToast('Błąd pobierania: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🤖</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">GENERATOR PROMPTÓW DLA CHATGPT</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Generuj ustrukturyzowany kontekst ze swoimi realnymi danymi treningowymi. Skopiuj i wklej do ChatGPT.
          </p>
        </div>

        {/* Offline Privacy Guarantee Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl text-xs text-emerald-300">
          <span>🔒</span>
          <span>100% Prywatności — Zero API AI</span>
        </div>
      </div>

      {/* Mode Selector Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {contextTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedType === t.id
                ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                : 'bg-[#12131c] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <p className="font-bold text-xs text-zinc-200 mb-1">{t.title}</p>
            <p className="text-[10px] text-zinc-300 leading-snug line-clamp-2">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Prompt Card */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-white">{contextData?.title || 'Generowanie kontekstu...'}</h3>
            <p className="text-xs text-zinc-300">
              {contextData?.lines_count || 0} linii • {contextData?.char_count || 0} znaków
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadTxt}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Pobierz .txt</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black'
              }`}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'SKOPIOWANO!' : 'KOPIUJ KONTEKST'}</span>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="bg-black/60 border border-zinc-800/90 rounded-2xl p-5 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[55vh] overflow-y-auto custom-scrollbar select-all">
          {loading ? 'Generowanie lokalnego raportu...' : contextData?.context_text}
        </div>

        <p className="text-[11px] text-zinc-300 italic text-center">
          Wskazówka: Po skopiowaniu, otwórz ChatGPT i wklej tekst za pomocą <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Ctrl + V</kbd>.
        </p>

      </div>

    </div>
  );
}
