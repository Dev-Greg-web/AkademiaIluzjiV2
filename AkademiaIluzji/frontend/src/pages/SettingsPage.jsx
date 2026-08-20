import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import OnboardingModal from '../components/OnboardingModal';

export default function SettingsPage() {
  const { profile, refreshProfile, showToast } = useApp();
  
  const [name, setName] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [preferredMinutes, setPreferredMinutes] = useState(20);
  const [focusTrack, setFocusTrack] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || 'Adept Iluzji');
      setPrimaryGoal(profile.primary_goal || '');
      setPreferredMinutes(profile.preferred_daily_minutes || 20);
      setFocusTrack(profile.focus_track || 'all');
      setSoundEnabled(profile.sound_enabled !== 0);
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        name,
        primary_goal: primaryGoal,
        preferred_daily_minutes: preferredMinutes,
        focus_track: focusTrack,
        sound_enabled: soundEnabled ? 1 : 0
      });
      await refreshProfile();
      showToast('Zapisano ustawienia profilu', 'success');
    } catch (err) {
      showToast('Błąd zapisu: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      await api.exportJson();
      showToast('Pobrano pełną kopię zapasową bazy danych!', 'success');
    } catch (err) {
      showToast('Błąd eksportu: ' + err.message, 'error');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Czy na pewno chcesz zaimportować kopię zapasową? Nadpisze to obecne dane.')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      await api.importJsonFile(file);
      await refreshProfile();
      showToast('Pomyślnie zaimportowano bazę danych!', 'success');
    } catch (err) {
      showToast('Błąd importu: ' + err.message, 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('⚠️ UWAGA: Czy na pewno chcesz całkowicie zresetować bazę danych do wartości początkowych? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      await api.resetDatabase();
      await refreshProfile();
      showToast('Zresetowano bazę danych i zainicjalizowano domyślny zestaw', 'info');
    } catch (err) {
      showToast('Błąd resetu: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">USTAWIENIA COACHA</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Zarządzaj profilem, preferencjami codziennego treningu oraz kopią zapasową.
          </p>
        </div>
      </div>

      {/* Profile & Goals Form */}
      <form onSubmit={handleSaveProfile} className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <span>👤</span>
          <span>Profil Użytkownika</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Twoje Imię / Pseudonim:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Domyślny czas treningu:</label>
            <select
              value={preferredMinutes}
              onChange={(e) => setPreferredMinutes(parseInt(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
            >
              {[5, 10, 15, 20, 30, 45, 60].map(m => (
                <option key={m} value={m}>{m} minut dziennie</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Główny cel treningowy:</label>
          <input
            type="text"
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            placeholder="np. Opanuj Double Lift na poziomie 8/10..."
            className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-300 font-bold uppercase block mb-1">Główny fokus ścieżki:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'Wszystkie 3' },
              { id: 'magic', label: 'Tylko Magic' },
              { id: 'cardistry', label: 'Cardistry' },
              { id: 'performance', label: 'Performance' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFocusTrack(t.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  focusTrack === t.id
                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz Ustawienia Profilu'}
        </button>
      </form>

      {/* Backup, Export & Onboarding */}
      <div className="bg-[#12131c] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <span>💾</span>
          <span>Kopia Zapasowa i Zarządzanie Danymi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={handleExport}
            className="p-4 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-left transition-all group"
          >
            <span className="text-xl block mb-1">📦</span>
            <span className="font-bold text-xs text-zinc-100 group-hover:text-amber-300 block">Eksportuj Bazę (JSON)</span>
            <span className="text-[10px] text-zinc-300 block mt-0.5">Pobierz kopię technik, sesji i notatek</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="p-4 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-left transition-all group"
          >
            <span className="text-xl block mb-1">📥</span>
            <span className="font-bold text-xs text-zinc-100 group-hover:text-emerald-300 block">
              {importing ? 'Importowanie...' : 'Importuj Kopię (JSON)'}
            </span>
            <span className="text-[10px] text-zinc-300 block mt-0.5">Wczytaj wcześniej zapisany plik .json</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => setShowOnboarding(true)}
            className="p-4 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-left transition-all group"
          >
            <span className="text-xl block mb-1">🚀</span>
            <span className="font-bold text-xs text-zinc-100 group-hover:text-amber-300 block">Uruchom Onboarding</span>
            <span className="text-[10px] text-zinc-300 block mt-0.5">Skonfiguruj poziom i znane techniki</span>
          </button>

        </div>

        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-400">Reset Bazy Danych</p>
            <p className="text-[10px] text-zinc-300">Przywraca domyślne chwyty, rutyny i poziom 1</p>
          </div>
          <button
            onClick={handleResetDatabase}
            className="px-4 py-2 bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition-all"
          >
            Resetuj do Domyślnych
          </button>
        </div>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

    </div>
  );
}
