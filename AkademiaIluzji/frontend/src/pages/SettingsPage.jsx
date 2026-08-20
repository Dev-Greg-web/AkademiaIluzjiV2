import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Settings, 
  User, 
  Target, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, refreshProfile, showToast, fireConfetti } = useApp();
  const [name, setName] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || 'Iluzjonista');
      setPrimaryGoal(profile.primary_goal || 'Opanuj Double Lift na poziomie 8/10.');
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await api.updateProfile({
        name: name.trim(),
        primary_goal: primaryGoal.trim()
      });
      showToast('Zapisano dane profilu', 'success');
      refreshProfile();
    } catch (err) {
      showToast('Błąd zapisu profilu', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportJson = async () => {
    try {
      await api.exportJson();
      showToast('💾 Pomyślnie pobrano plik backupu JSON', 'success');
    } catch (err) {
      showToast('Błąd eksportu JSON', 'error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const res = await api.importJson(jsonData);
      fireConfetti();
      showToast('📥 Baza danych została pomyślnie przywrócona!', 'success');
      refreshProfile();
    } catch (err) {
      showToast('Nieprawidłowy plik JSON backupu', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ UWAGA: Czy na pewno chcesz zresetować wszystkie statystyki, historię i poziomy do stanu początkowego?'
    );
    if (!confirmed) return;

    try {
      await api.resetDatabase();
      showToast('Zresetowano stan bazy do wartości początkowych', 'info');
      refreshProfile();
    } catch (err) {
      showToast('Błąd resetu bazy', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          ⚙️ Ustawienia & Kopia Zapasowa
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Zarządzaj profilem, konfiguruj cele oraz twórz lokalne kopie zapasowe
        </p>
      </div>

      {/* User Profile Form */}
      <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-rose-500" />
          Profil Iluzjonisty
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Imię / Pseudonim
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Główny aktualny cel treningowy
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="Np. Opanuj Double Lift na poziomie 8/10."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Zapisywanie...' : 'Zapisz profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Data Management (JSON Export/Import) */}
      <div className="p-6 rounded-3xl bg-[#12131b] border border-zinc-800 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-400" />
          Kopia Zapasowa Danych (JSON)
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Możesz w każdej chwili wyeksportować całą swoją bazę technik, historię treningów, rutyny i notatki do jednego pliku JSON, aby przenieść je na inny komputer lub bezpiecznie zarchiwizować.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJson}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold border border-zinc-700/80 flex items-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            💾 Pobierz pełny backup JSON
          </button>

          <label className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold border border-zinc-700/80 flex items-center gap-2 cursor-pointer transition active:scale-95">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>{importing ? 'Importowanie...' : '📥 Przywróć z pliku JSON'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Reset */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/40 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Strefa Niebezpieczna
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Resetowanie bazy usunie całą historię treningów i przywróci domyślny zestaw 23 technik ze statusem początkowym.
        </p>

        <button
          onClick={handleResetDatabase}
          className="px-5 py-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white rounded-xl text-xs font-bold border border-rose-700/50 flex items-center gap-2 transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Zresetuj bazę do stanu początkowego
        </button>
      </div>

      {/* Offline & Privacy Badge */}
      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center gap-3.5 text-xs text-zinc-400">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-zinc-200">Gwarancja Prywatności & Offline-First</p>
          <p className="mt-0.5">Wszystkie dane są zapisywane wyłącznie w lokalnej bazie SQLite na Twoim dysku. Żadne dane ani statystyki nie są przesyłane do zewnętrznych chmur.</p>
        </div>
      </div>
    </div>
  );
}
