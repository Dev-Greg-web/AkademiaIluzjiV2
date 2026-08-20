import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { X, Sparkles, Plus, Trash2, Check } from 'lucide-react';

export default function RoutineModal({ isOpen, routine, onClose, onSaved }) {
  const { showToast, fireConfetti, refreshProfile } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [patter, setPatter] = useState('');
  const [notes, setNotes] = useState('');
  const [techniquesList, setTechniquesList] = useState([]);
  const [allTechniques, setAllTechniques] = useState([]);
  const [selectedTechToAdd, setSelectedTechToAdd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch available techniques for selection
      api.getTechniques().then((data) => setAllTechniques(data)).catch(console.error);

      if (routine) {
        setName(routine.name || '');
        setDescription(routine.description || '');
        setEffect(routine.effect || '');
        setDifficulty(routine.difficulty || 'Intermediate');
        setPatter(routine.patter || '');
        setNotes(routine.notes || '');
        setTechniquesList(routine.techniques || []);
      } else {
        setName('');
        setDescription('');
        setEffect('');
        setDifficulty('Intermediate');
        setPatter('');
        setNotes('');
        setTechniquesList([]);
      }
    }
  }, [isOpen, routine]);

  if (!isOpen) return null;

  const handleAddTechnique = () => {
    if (!selectedTechToAdd) return;
    if (!techniquesList.includes(selectedTechToAdd)) {
      setTechniquesList([...techniquesList, selectedTechToAdd]);
    }
    setSelectedTechToAdd('');
  };

  const handleRemoveTechnique = (index) => {
    setTechniquesList(techniquesList.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nazwa rutyny jest wymagana', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        effect: effect.trim(),
        difficulty,
        patter: patter.trim(),
        notes: notes.trim(),
        techniques: techniquesList
      };

      if (routine?.id) {
        await api.updateRoutine(routine.id, payload);
        showToast('Zaktualizowano rutynę', 'success');
      } else {
        const res = await api.createRoutine(payload);
        fireConfetti();
        showToast(`Utworzono nową rutynę! +${res.xp_gained} XP`, 'success', res.xp_gained);
        refreshProfile();
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      showToast('Błąd zapisu rutyny', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111219] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-[#151622] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {routine?.id ? 'Edytuj Rutynę' : 'Nowa Rutyna Magiczna'}
              </h2>
              <p className="text-xs text-zinc-400">
                Połącz chwyty w spójną sekwencję, zaplanuj efekt i patter (narrację)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Nazwa rutyny / efektu *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Np. Ambitious Card, Triumph, Karta w kieszeni..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Poziom trudności
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Efekt dla widza (Co widzi publiczność)
            </label>
            <input
              type="text"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="Np. Podpisana karta wędruje na wierzch pomimo przekładania..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Techniques sequence */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              Sekwencja chwytów / sleightów w rutynie:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedTechToAdd}
                onChange={(e) => setSelectedTechToAdd(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Wybierz technikę z bazy --</option>
                {allTechniques.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.category} - {t.user_level}/10)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTechnique}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
              >
                <Plus className="w-4 h-4" />
                Dodaj krok
              </button>
            </div>

            {/* List of steps */}
            <div className="space-y-1.5 pt-1">
              {techniquesList.map((techName, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/40 font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white">{techName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTechnique(idx)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {techniquesList.length === 0 && (
                <p className="text-xs text-zinc-400 italic">Brak przypisanych technik.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Patter / Narracja i Skrypt prezentacji
            </label>
            <textarea
              rows={3}
              value={patter}
              onChange={(e) => setPatter(e.target.value)}
              placeholder="Wpisz słowa, które mówisz widzom, żarty, misdirection słowne..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Opis struktury & Notatki techniczne
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Wskazówki dotyczące resetu talii, kątów lub przygotowania (setupu)..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Zapisywanie...' : routine?.id ? 'Zapisz zmiany' : 'Utwórz rutynę (+25 XP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
