import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import NoteModal from '../components/NoteModal';

export default function NotesPage() {
  const { showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const categories = ['Wszystkie', 'Ogólne', 'Teoria', 'Technika', 'Rutyna', 'Psychologia'];

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await api.getNotes({
        category: selectedCategory === 'Wszystkie' ? '' : selectedCategory
      });
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory]);

  const handleDelete = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;
    try {
      await api.deleteNote(noteId);
      showToast('Usunięto notatkę', 'info');
      fetchNotes();
    } catch (err) {
      showToast('Błąd usuwania: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📝</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">NOTATKI & BAZA WIEDZY</h1>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Własne spostrzeżenia, skrypty narracji, pomysły na rutyny i odkrycia z treningów.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          + Dodaj Nową Notatkę
        </button>
      </div>

      {/* Categories Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => (
            <div
              key={n.id}
              onClick={() => setSelectedNote(n)}
              className="bg-[#12131c] hover:bg-[#161726] border border-zinc-800 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {n.category || 'Ogólne'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="text-zinc-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑️
                  </button>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                  {n.title || 'Bez tytułu'}
                </h3>

                <p className="text-xs text-zinc-300 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {n.content}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-850 text-[10px] text-zinc-300 mt-4 flex items-center justify-between">
                <span>{n.created_at?.slice(0, 16)}</span>
                <span className="text-amber-400 font-semibold group-hover:underline">Edytuj →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#12131c] border border-zinc-800 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-300">Brak notatek w tej kategorii.</p>
        </div>
      )}

      {/* Note Modal */}
      {(selectedNote || showCreateModal) && (
        <NoteModal
          note={selectedNote}
          isOpen={!!selectedNote || showCreateModal}
          onClose={() => {
            setSelectedNote(null);
            setShowCreateModal(false);
          }}
          onSaved={fetchNotes}
        />
      )}

    </div>
  );
}
