import React, { useState, useEffect } from 'react';
import { Note, Consultation } from '../types';
import { Search, Plus, Edit2, Trash2, BookOpen, Calendar, User, FileText, X, AlertCircle, Sparkles, Copy, Printer } from 'lucide-react';
import api from '../services/api';

interface NotesViewProps {
  notes: Note[];
  consultations: Consultation[];
  onRefresh: () => Promise<void>;
  onNavigateTo: (view: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  consultations,
  onRefresh,
  onNavigateTo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // fields
  const [consultationId, setConsultationId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-seed consultation context if coming from details page
  useEffect(() => {
    const rawContext = sessionStorage.getItem('current_consultation_context');
    if (rawContext) {
      try {
        const context = JSON.parse(rawContext);
        setConsultationId(context.id);
        setTitle(`${context.title} Review Note`);
        setIsFormOpen(true);
      } catch (e) {}
      sessionStorage.removeItem('current_consultation_context');
    }
  }, []);

  const handleOpenCreate = () => {
    if (consultations.length === 0) {
      alert('You must schedule at least one consultation before compiling additional private assessment notes.');
      onNavigateTo('Consultations');
      return;
    }
    setEditingNote(null);
    setConsultationId(consultations[0].id);
    setTitle('');
    setContent('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (n: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(n);
    setConsultationId(n.consultationId);
    setTitle(n.title);
    setContent(n.content);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete note: "${title}"?`)) {
      return;
    }
    try {
      await api.delete(`/notes/${id}`);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete note', err);
      alert('Failed to delete note.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!consultationId) {
      setFormError('Please link this note to a consultation.');
      setSubmitting(false);
      return;
    }
    if (!title.trim() || !content.trim()) {
      setFormError('Title and note body content are required.');
      setSubmitting(false);
      return;
    }

    const payload = {
      consultationId,
      title,
      content
    };

    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote.id}`, payload);
      } else {
        await api.post('/notes', payload);
      }
      setIsFormOpen(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to submit notes record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`)
      .then(() => alert('Note text copied to clipboard successfully!'))
      .catch(err => console.error('Clip copy failed', err));
  };

  // filter
  const filteredNotes = notes.filter(n => {
    const term = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(term) ||
           n.content.toLowerCase().includes(term) ||
           (n.clientName || '').toLowerCase().includes(term) ||
           (n.consultationTitle || '').toLowerCase().includes(term);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Sidebar List and search */}
      <div className={`xl:col-span-1 space-y-6 animate-fade-in ${selectedNote ? 'hidden xl:block' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-505 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition shrink-0"
            title="Create Note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Notes index list */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 max-h-[70vh] overflow-y-auto">
          <div className="divide-y divide-slate-750">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNote(n)}
                className={`p-4.5 hover:bg-slate-705/30 cursor-pointer transition flex flex-col gap-2 ${selectedNote?.id === n.id ? 'bg-indigo-505/10 border-l-2 border-l-indigo-650' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-white truncate">{n.title}</h4>
                  <div className="flex items-center gap-1.5" onClick={e=>e.stopPropagation()}>
                    <button onClick={(e) => handleOpenEdit(n, e)} className="p-1 text-slate-450 hover:text-white transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDelete(n.id, n.title, e)} className="p-1 text-slate-455 hover:text-rose-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.content}</p>
                <div className="flex items-center justify-between text-3xs font-mono text-slate-500 mt-1">
                  <span>{n.clientName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No archived private assessment notes found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note view and Edit Panel */}
      <div className={`xl:col-span-2 space-y-6 ${selectedNote ? 'block' : 'hidden xl:block'}`}>
        {selectedNote ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden min-h-[50vh] flex flex-col justify-between relative">
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-700/40 hover:bg-slate-650 text-slate-400 hover:text-white transition xl:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Note head */}
            <div className="p-6 bg-slate-900/30 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-3xs font-bold text-slate-405 uppercase tracking-wider block font-mono">Archive Note Reference</span>
                <h3 className="text-lg font-display font-bold text-indigo-400 mt-1.5 leading-snug">{selectedNote.title}</h3>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2.5">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-500" /> {selectedNote.clientName}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-500" /> {selectedNote.consultationTitle}
                  </span>
                </div>
              </div>

              {/* Share utilities */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-350 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Copy note body to clipboard"
                >
                  <Copy className="w-4 h-4" /> Copy Text
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 border border-slate-705 hidden sm:inline-flex hover:bg-slate-700 rounded-xl text-slate-350 hover:text-white text-xs font-semibold items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" /> Print Dossier
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 flex-1 text-sm text-slate-205 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
              {selectedNote.content}
            </div>

            {/* Footer stamp */}
            <div className="bg-slate-900/20 px-6 py-4 border-t border-slate-700/30 flex items-center justify-between text-2xs text-slate-500">
              <span className="font-mono">Reference Entry Protocol &bull; ID: {selectedNote.id}</span>
              <span className="font-mono">Created On: {new Date(selectedNote.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 border-dashed p-10 text-center h-full flex flex-col justify-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300 mt-4">Select or Compose Notes</h3>
            <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Select an existing private session ledger from the database index or write a new one linked to active consultation files.</p>
          </div>
        )}
      </div>

      {/* Note Creation / Editing Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl border border-slate-705 max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-750 flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-white">
                {editingNote ? 'Modify Confidential Note' : 'Register Confidential Consultation Note'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-750 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-450 shrink-0" />
                  <p className="text-xs text-rose-300 font-medium">{formError}</p>
                </div>
              )}

              {/* Consultation Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-widest mb-1.5">Consultation Reference *</label>
                <select
                  value={consultationId}
                  onChange={e => setConsultationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700 text-slate-300 rounded-xl text-sm focus:outline-none"
                >
                  {consultations.map(con => (
                    <option key={con.id} value={con.id}>{con.title} ({con.clientName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-widest mb-1.5">Note Heading / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Saturn Conjunct Transit Briefing Summary"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-sm text-write-white text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-widest mb-1.5">Private Body Content *</label>
                <textarea
                  required
                  placeholder="Record confidential progress assessments, recommended actions, and counseling timelines..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4.5 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-sm text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-704 text-sm font-semibold rounded-xl text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Archiving...' : 'Save Notes record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
