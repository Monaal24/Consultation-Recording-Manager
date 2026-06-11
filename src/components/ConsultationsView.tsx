import React, { useState } from 'react';
import { Consultation, Client } from '../types';
import { Search, Plus, Edit2, Trash2, Calendar, Video, Phone, User, Clock, Filter, AlertCircle, X, MapPin } from 'lucide-react';
import api from '../services/api';

interface ConsultationsViewProps {
  consultations: Consultation[];
  clients: Client[];
  onRefresh: () => Promise<void>;
  onNavigateTo: (view: string) => void;
}

export const ConsultationsView: React.FC<ConsultationsViewProps> = ({
  consultations,
  clients,
  onRefresh,
  onNavigateTo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCon, setEditingCon] = useState<Consultation | null>(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [consultationType, setConsultationType] = useState('Video');
  const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detailed view drawer
  const [selectedCon, setSelectedCon] = useState<Consultation | null>(null);

  const handleOpenCreate = () => {
    if (clients.length === 0) {
      alert('You must register at least one client before scheduling a consultation.');
      onNavigateTo('Clients');
      return;
    }
    setEditingCon(null);
    setClientId(clients[0].id);
    setTitle('');
    
    // Default to current time in local timezone formatted nicely for datetime-local value
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setConsultationDate(now.toISOString().slice(0, 16));
    
    setConsultationType('Video');
    setStatus('Scheduled');
    setDescription('');
    setNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Consultation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCon(c);
    setClientId(c.clientId);
    setTitle(c.title);
    
    // Format to YYYY-MM-DDTHH:MM
    const dateObj = new Date(c.consultationDate);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    setConsultationDate(dateObj.toISOString().slice(0, 16));

    setConsultationType(c.consultationType);
    setStatus(c.status);
    setDescription(c.description);
    setNotes(c.notes);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the consultation "${title}"? Associated recordings and notes will be deleted!`)) {
      return;
    }
    try {
      await api.delete(`/consultations/${id}`);
      if (selectedCon?.id === id) {
        setSelectedCon(null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete consultation', err);
      alert('Failed to delete consultation.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!clientId) {
      setFormError('Please select a client from your portfolio.');
      setSubmitting(false);
      return;
    }
    if (!title.trim()) {
      setFormError('Consultation Title is required.');
      setSubmitting(false);
      return;
    }

    const payload = {
      clientId,
      title,
      consultationDate: new Date(consultationDate).toISOString(),
      consultationType,
      status,
      description,
      notes
    };

    try {
      if (editingCon) {
        await api.put(`/consultations/${editingCon.id}`, payload);
      } else {
        await api.post('/consultations', payload);
      }
      setIsFormOpen(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to submit consultation details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter computations
  const filteredConsultations = consultations.filter(c => {
    const clientName = c.clientName || '';
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesType = typeFilter === 'All' || c.consultationType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filtering Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search consultations or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-450" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <Video className="w-3.5 h-3.5 text-slate-450" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Formats</option>
              <option value="Video">Video Session</option>
              <option value="Phone">Phone Session</option>
              <option value="In-Person">In-Person Session</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition inline-flex items-center gap-1.5 justify-center shrink-0 shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4.5 h-4.5" />
          Schedule Consultation
        </button>
      </div>

      {/* Consultations Master and details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left main list */}
        <div className={`lg:col-span-2 space-y-4 ${selectedCon ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {filteredConsultations.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCon(c)}
                  className={`p-5 hover:bg-slate-50 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedCon?.id === c.id ? 'bg-indigo-50/50 border-l-[3px] border-l-indigo-600' : ''}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[250px]">{c.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                        c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                        c.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-700 border border-indigo-250' :
                        'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {c.clientName}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(c.consultationDate).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{c.description || 'No description provided'}</p>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2.5 sm:self-center" onClick={e=>e.stopPropagation()}>
                    <span className="text-xs text-slate-500 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono shrink-0">
                      {c.consultationType}
                    </span>
                    <button
                      onClick={(e) => handleOpenEdit(c, e)}
                      className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition"
                      title="Edit Consultation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(c.id, c.title, e)}
                      className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-655 rounded-lg transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredConsultations.length === 0 && (
                <div className="p-10 text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 mt-3">No consultations logged matching your active filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right drawer detail column */}
        <div className={`lg:col-span-1 space-y-6 ${selectedCon ? 'block' : 'hidden lg:block'}`}>
          {selectedCon ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm">
              <button 
                onClick={() => setSelectedCon(null)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <span className="text-[10px] font-mono font-bold text-indigo-705 text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedCon.consultationType} Summary
                </span>
                <h3 className="text-base font-display font-bold text-slate-900 mt-3 leading-snug">{selectedCon.title}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {selectedCon.clientName}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-mono">Consultation Schedule</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                    <Calendar className="w-4 h-4 text-slate-405 text-slate-400" />
                    <span>{new Date(selectedCon.consultationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                    <Clock className="w-4 h-4 text-slate-405 text-slate-400" />
                    <span>{new Date(selectedCon.consultationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-405 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedCon.consultationType === 'Video' ? 'Online Video Conference URL generated during sessions' : selectedCon.consultationType === 'Phone' ? 'Callback recorded on profile phone' : 'In-Person Meeting Lounge'}</span>
                  </div>
                </div>

                {selectedCon.description && (
                  <div className="space-y-2">
                    <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-mono">Objective Description</h4>
                    <p className="text-xs text-slate-605 text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">{selectedCon.description}</p>
                  </div>
                )}

                {selectedCon.notes && (
                  <div className="space-y-2">
                    <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-mono font-bold">Confidential Assessment Notes</h4>
                    <div className="bg-amber-50 p-3.5 rounded-lg border-l-[3px] border-amber-400 text-xs text-amber-900 italic whitespace-pre-wrap leading-relaxed">
                      "{selectedCon.notes}"
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('current_consultation_context', JSON.stringify({ id: selectedCon.id, title: selectedCon.title }));
                      onNavigateTo('Recordings');
                    }}
                    className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold text-center transition shadow-sm shadow-indigo-100"
                  >
                    View Recordings
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('current_consultation_context', JSON.stringify({ id: selectedCon.id, title: selectedCon.title }));
                      onNavigateTo('Notes');
                    }}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold text-center transition"
                  >
                    Confidential Notes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-250 border-dashed p-10 text-center h-full flex flex-col justify-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900 mt-4">Select a Session Block</h3>
              <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Click any consultation list block to show description parameters, timeline schedulers, or jump to linked audio modules and notes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Consultation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-205 max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-800">
                {editingCon ? 'Modify Scheduled Session' : 'Schedule Consultation Meeting'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="max-h-[85vh] overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-250 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-700 font-medium">{formError}</p>
                </div>
              )}

              {/* Client select dropdown */}
              {!editingCon && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Client Profile *</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  >
                    <option value="">Select Client</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name} ({cl.email || cl.phone || 'No Contact'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Consultation Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Natal Chart Astral Alignment"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Schedule Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={consultationDate}
                    onChange={e => setConsultationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Format Type</label>
                  <select
                    value={consultationType}
                    onChange={e => setConsultationType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  >
                    <option value="Video">Video Session</option>
                    <option value="Phone">Phone Session</option>
                    <option value="In-Person">In-Person Session</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Status Indicator</label>
                <div className="flex gap-2.5">
                  {(['Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        status === st 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-550 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono font-mono">Brief Description / Objective</label>
                <textarea
                  placeholder="Focus key parameters to cover in Saturn conjunct placement guides..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Assessment Notes (Private)</label>
                <textarea
                  placeholder="confidential notes regarding the consult..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-sm font-semibold rounded-lg text-slate-550 text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 shadow-sm shadow-indigo-100"
                >
                  {submitting ? 'Scheduling...' : 'Save Consultation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
