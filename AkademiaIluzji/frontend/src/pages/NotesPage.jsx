import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import NoteModal from '../components/NoteModal';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar,
  Layers
} from 'lucide-react';

const NOTE_CATEGORIES = ['Wszystkie', 'Ogólne', 'Teoria', 'Technika', 'Rutyna', 'Trening'];

export default function NotesPage() {
  const { showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await api.getNotes({
        category: selectedCategory
      });
      setNotes(data);
    } catch (err) {
      showToast('Błąd pobierania notatek', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory]);

  const handleCreateNew = () => {
    setEditingNote(null);
    setModalOpen(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;
    try {
      await api.deleteNote(id);
      showToast('Usunięto notatkę', 'info');
      fetchNotes();
    } catch (err) {
      showToast('Błąd usuwania notatki', 'error');
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      n.title?.toLowerCase().includes(term) ||
      n.content?.toLowerCase().includes(term) ||
      n.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            📝 Notatki & Baza Wiedzy
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Zapisuj przemyślenia, teorie psychologiczne, zasady misdirection i patter
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Dodaj notatkę
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#12131b] border border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj w notatkach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {NOTE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Ładowanie notatek...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131b] border border-zinc-800 space-y-3">
          <StickyNote className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Brak notatek</h3>
          <p className="text-xs text-zinc-400">Dodaj swoje pierwsze notatki i przemyślenia!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-2xl bg-[#12131b] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-3 shadow-lg group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {note.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition">
                  {note.title}
                </h3>

                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                <span>{note.updated_at?.slice(0, 10)}</span>
                {note.technique_name && (
                  <span className="text-rose-400 truncate max-w-[120px]">
                    chwyt: {note.technique_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={modalOpen}
        note={editingNote}
        onClose={() => setModalOpen(false)}
        onSaved={fetchNotes}
      />
    </div>
  );
}
