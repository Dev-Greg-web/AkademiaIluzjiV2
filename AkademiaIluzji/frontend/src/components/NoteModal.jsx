import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { X, StickyNote, Check } from 'lucide-react';

export default function NoteModal({ isOpen, note, onClose, onSaved }) {
  const { showToast, fireConfetti, refreshProfile } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Ogólne');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setCategory(note.category || 'Ogólne');
      } else {
        setTitle('');
        setContent('');
        setCategory('Ogólne');
      }
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Treść notatki nie może być pusta', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim() || 'Bez tytułu',
        content: content.trim(),
        category
      };

      if (note?.id) {
        await api.updateNote(note.id, payload);
        showToast('Zaktualizowano notatkę', 'success');
      } else {
        const res = await api.createNote(payload);
        showToast(`Dodano notatkę! +${res.xp_gained} XP`, 'success', res.xp_gained);
        refreshProfile();
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      showToast('Błąd zapisu notatki', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111219] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-[#151622] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {note?.id ? 'Edytuj Notatkę' : 'Nowa Notatka'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Tytuł notatki
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Np. Zasady misdirection, kąty Passa..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Kategoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Ogólne">Ogólne</option>
              <option value="Teoria">Teoria i Psychologia</option>
              <option value="Technika">Technika</option>
              <option value="Rutyna">Rutyna i Patter</option>
              <option value="Trening">Trening i Obserwacje</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Treść notatki *
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Wpisz swoje spostrzeżenia, cytaty mistrzów, pomysły na rutyny..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between">
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
              className="px-6 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Zapisywanie...' : note?.id ? 'Zapisz zmiany' : 'Dodaj notatkę (+10 XP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
