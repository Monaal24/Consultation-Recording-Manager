import React, { useState } from 'react';
import { Client, Consultation, Recording, Note } from '../types';
import { Search, Plus, Edit2, Trash2, Mail, Phone, MapPin, User, ChevronLeft, ChevronRight, FileText, Calendar, AudioLines, Info, X } from 'lucide-react';
import api from '../services/api';

interface ClientsViewProps {
  clients: Client[];
  consultations: Consultation[];
  recordings: Recording[];
  notes: Note[];
  onRefresh: () => Promise<void>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  consultations,
  recordings,
  notes,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected client profile viewer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Unspecified');
  const [address, setAddress] = useState('');
  const [notesText, setNotesText] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Open form for create
  const handleOpenCreate = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setAge('');
    setGender('Unspecified');
    setAddress('');
    setNotesText('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open form for edit
  const handleOpenEdit = (c: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening profile
    setEditingClient(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setAge(c.age ? c.age.toString() : '');
    setGender(c.gender);
    setAddress(c.address);
    setNotesText(c.notes);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening profile
    if (!window.confirm(`Are you absolutely sure you want to delete ${name}? This will permanently purge all related consultations, notes, and recordings!`)) {
      return;
    }
    try {
      await api.delete(`/clients/${id}`);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete client', err);
      alert('Failed to delete client. Access restricted or connection error.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!name.trim()) {
      setFormError('Client name is required.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      email,
      phone,
      age: age ? parseInt(age) : 0,
      gender,
      address,
      notes: notesText
    };

    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      setIsFormOpen(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to submit client form.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination bounds
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  // Profile associations
  const clientConsultations = consultations.filter(con => con.clientId === selectedClient?.id);
  const consultationIds = clientConsultations.map(con => con.id);
  const clientRecordings = recordings.filter(rec => consultationIds.includes(rec.consultationId));
  const clientNotes = notes.filter(n => consultationIds.includes(n.consultationId));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Primary List Column */}
      <div className={`xl:col-span-2 space-y-6 ${selectedClient ? 'hidden xl:block' : ''}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-650 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition inline-flex items-center gap-1.5 shrink-0 justify-center shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Client
          </button>
        </div>

        {/* Clients list container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-505 uppercase tracking-wider">
                  <th className="py-4 px-5">Client Name</th>
                  <th className="py-4 px-5">Contact Details</th>
                  <th className="py-4 px-5">Demographics</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentClients.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedClient(c)}
                    className={`hover:bg-slate-50 cursor-pointer transition ${selectedClient?.id === c.id ? 'bg-indigo-50/50 border-l-[3px] border-l-indigo-600' : ''}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                          {c.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{c.name}</p>
                          <p className="text-2xs text-slate-400 mt-0.5 uppercase">ID: {c.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-605 text-slate-600 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.email || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-550 text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.phone || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-xs text-slate-655 text-slate-600 space-y-0.5">
                        <span className="block font-medium">{c.gender} &bull; {c.age ? `${c.age} yrs` : 'Age N/A'}</span>
                        <span className="text-slate-400 text-2xs block truncate max-w-[150px]">{c.address || 'No address logged'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e=>e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(c.id, c.name, e)}
                          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-655 rounded-lg transition"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-sm text-slate-500">No active clients found matching that description.</p>
                      <button onClick={handleOpenCreate} className="mt-4 text-xs font-semibold text-indigo-600 hover:underline">Add one now</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-200 py-3.5 px-5 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredClients.length)} of {filteredClients.length} clients
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-3 font-mono">{currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-605 text-slate-600 hover:text-slate-900 transition disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Profile Sidebar Column */}
      <div className={`xl:col-span-1 space-y-6 ${selectedClient ? 'block' : 'hidden xl:block'}`}>
        {selectedClient ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            <button 
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition xl:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-2xl mx-auto flex items-center justify-center shadow-sm">
                {selectedClient.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <h3 className="text-lg font-display font-semibold text-slate-900 mt-4">{selectedClient.name}</h3>
              <p className="text-xs text-slate-505 text-slate-500 mt-1">{selectedClient.gender} &bull; {selectedClient.age} Years Old</p>
            </div>

            {/* Profile Info Details */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest">Client Dossier</h4>
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail className="w-4 h-4 text-slate-450" />
                    <span>{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="w-4 h-4 text-slate-450" />
                    <span>{selectedClient.phone}</span>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                    <span>{selectedClient.address}</span>
                  </div>
                )}
              </div>

              {selectedClient.notes && (
                <div className="space-y-2 bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <span className="text-2xs font-extrabold text-amber-805 uppercase tracking-widest block">Executive Consultation Notes</span>
                  <p className="text-xs text-amber-900 leading-relaxed italic">"{selectedClient.notes}"</p>
                </div>
              )}

              {/* Consultation histories */}
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block">Consultation History ({clientConsultations.length})</h4>
                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
                  {clientConsultations.map(con => (
                    <div key={con.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
                      <p className="text-xs font-semibold text-slate-900 pr-14 truncate">{con.title}</p>
                      <p className="text-2xs text-slate-550 mt-1">{con.consultationType} &bull; {new Date(con.consultationDate).toLocaleDateString()}</p>
                      <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-705 border border-indigo-200 rounded-full font-bold uppercase">{con.status}</span>
                    </div>
                  ))}
                  {clientConsultations.length === 0 && (
                    <p className="text-xs text-slate-550 italic">No scheduled session consultations.</p>
                  )}
                </div>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Recordings</span>
                  <span className="text-lg font-bold text-violet-605 text-violet-700 font-mono mt-0.5 inline-flex items-center gap-1.5">
                    <AudioLines className="w-4.5 h-4.5" /> {clientRecordings.length}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Logged Notes</span>
                  <span className="text-lg font-bold text-sky-605 text-sky-700 font-mono mt-0.5 inline-flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5" /> {clientNotes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-250 border-dashed p-10 text-center h-full flex flex-col justify-center">
            <User className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900 mt-4">Select a Client Profile</h3>
            <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Click any row in the table to display complete consultation history, audio uploads, and notes.</p>
          </div>
        )}
      </div>

      {/* Creation / Editing Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-xl relative">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 tracking-tight">
                {editingClient ? `Edit ${editingClient.name}` : 'Register New Client Profile'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-705 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="max-h-[85vh] overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-250 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-700 font-medium">{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Marcus Vance"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Email Address</label>
                  <input
                    type="email"
                    placeholder="marcus@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Age</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="35"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  >
                    <option value="Unspecified">Unspecified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Postal Address</label>
                <input
                  type="text"
                  placeholder="123 Pine St, Seattle, WA"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Private Assessment Context Notes</label>
                <textarea
                  placeholder="Client requests deep astrological reports or weekly business summaries..."
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-sm font-semibold rounded-lg text-slate-550 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 shadow-sm shadow-indigo-100"
                >
                  {submitting ? 'Submitting...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
