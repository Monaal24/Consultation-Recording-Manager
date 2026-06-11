import React, { useState, useRef, useEffect } from 'react';
import { Recording, Consultation, AISummary } from '../types';
import { Search, Plus, Trash2, Calendar, Music, Play, Pause, FastForward, Sparkles, UploadCloud, Tag, FileText, ChevronRight, X, AlertCircle, Info, Download, ArrowBigUpDash } from 'lucide-react';
import api from '../services/api';

interface RecordingsViewProps {
  recordings: Recording[];
  consultations: Consultation[];
  onRefresh: () => Promise<void>;
  onNavigateTo: (view: string) => void;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({
  recordings,
  consultations,
  onRefresh,
  onNavigateTo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Selection
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  
  // Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadConsultationId, setUploadConsultationId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop states
  const [dragging, setDragging] = useState(false);

  // AI Summary States
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'summary' | 'keyPoints' | 'actions' | 'transit' | 'dialogue'>('summary');

  // Pre-seed consultation context if coming from details page
  useEffect(() => {
    const rawContext = sessionStorage.getItem('current_consultation_context');
    if (rawContext) {
      try {
        const context = JSON.parse(rawContext);
        setUploadConsultationId(context.id);
        setUploadTitle(`${context.title} Session Recording`);
        setIsUploadOpen(true);
      } catch (e) {}
      sessionStorage.removeItem('current_consultation_context');
    }
  }, []);

  // Update audio controls when active recording changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAiSummary(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [selectedRecording]);

  const handlePlayPause = () => {
    if (!audioRef.current || !selectedRecording) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Audio play failed', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || selectedRecording?.duration || 0);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const value = parseFloat(e.target.value);
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Drag and drop hooks
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (['.mp3', '.wav', '.m4a'].includes(ext)) {
        setAudioFile(file);
        if (!uploadTitle) {
          setUploadTitle(file.name.substring(0, file.name.lastIndexOf('.')));
        }
      } else {
        alert('Format rejected: Only MP3, WAV, and M4A audio formats are supported.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAudioFile(files[0]);
      if (!uploadTitle) {
        setUploadTitle(files[0].name.substring(0, files[0].name.lastIndexOf('.')));
      }
    }
  };

  // File upload trigger
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setSubmitting(true);
    setUploadProgress(0);

    if (!uploadConsultationId) {
      setUploadError('Please select a valid consultation reference.');
      setSubmitting(false);
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Recording Title is required.');
      setSubmitting(false);
      return;
    }
    if (!audioFile) {
      setUploadError('Audio file payload is required.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('consultationId', uploadConsultationId);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('tags', uploadTags);
    formData.append('audioFile', audioFile);

    try {
      await api.post('/recordings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 50;
          setUploadProgress(percentCompleted);
        }
      });

      setIsUploadOpen(false);
      // clean sheets
      setAudioFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadTags('');
      setUploadProgress(null);
      await onRefresh();
    } catch (err: any) {
      setUploadProgress(null);
      setUploadError(err.response?.data?.message || 'Failed to upload audio file.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecording = async (id: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the recording "${title}"? This will purge the audio file on disk!`)) {
      return;
    }
    try {
      await api.delete(`/recordings/${id}`);
      if (selectedRecording?.id === id) {
        setSelectedRecording(null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete recording.');
    }
  };

  // AISummary call
  const handleTriggerAISummary = async () => {
    if (!selectedRecording) return;
    setAiLoading(true);
    setAiSummary(null);

    try {
      const response = await api.post(`/recordings/${selectedRecording.id}/ai-summary`);
      setAiSummary(response.data);
    } catch (error) {
      console.error('Failed to trigger AI summarizer', error);
      alert('Consultation summarizer is unavailable. Check API key configurations.');
    } finally {
      setAiLoading(false);
    }
  };

  // Computations
  const filteredRecordings = recordings.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (r.consultationTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || r.uploadDate.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* List Column */}
      <div className={`xl:col-span-2 space-y-6 ${selectedRecording ? 'hidden xl:block' : ''}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 items-stretch flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search recordings, types, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-450" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (consultations.length === 0) {
                alert('You must log a consultation before uploading its audio recording.');
                onNavigateTo('Consultations');
                return;
              }
              setUploadConsultationId(consultations[0].id);
              setUploadTitle('');
              setUploadDesc('');
              setUploadTags('');
              setAudioFile(null);
              setUploadError(null);
              setIsUploadOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition inline-flex items-center gap-1.5 justify-center shrink-0 shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4.5 h-4.5" />
            Upload Recording
          </button>
        </div>

        {/* Audio Catalogs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredRecordings.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecording(rec)}
                className={`p-5 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-4 ${selectedRecording?.id === rec.id ? 'bg-indigo-50/50 border-l-[3px] border-l-indigo-600' : ''}`}
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <Music className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[280px]">{rec.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{rec.clientName} &bull; {rec.consultationTitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {rec.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-655 text-slate-605 text-slate-600 rounded-md text-[10px] font-semibold uppercase font-mono">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      {formatDuration(rec.duration)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      {new Date(rec.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteRecording(rec.id, rec.title, e)}
                    className="p-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-505 text-slate-500 hover:text-rose-655 rounded-lg transition"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>
            ))}
            {filteredRecordings.length === 0 && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Music className="w-10 h-10 text-slate-300" />
                <p className="text-sm mt-3 font-semibold text-slate-800 animate-fade-in">No recording catalog matching parameters.</p>
                <p className="text-xs mt-1 text-slate-500">Ensure the correct dates are aligned in the filter dashboards.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail, Audio HTML5, and AI Summary Section Panel */}
      <div className={`xl:col-span-1 space-y-6 ${selectedRecording ? 'block' : 'hidden xl:block'}`}>
        {selectedRecording ? (
          <div className="bg-white rounded-xl border border-slate-205 overflow-hidden relative shadow-sm animate-fade-in">
            <button
              onClick={() => setSelectedRecording(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition xl:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title / Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 tracking-wider">Audio Player</span>
              <h3 className="text-base font-display font-semibold text-slate-900 mt-1.5 leading-snug">{selectedRecording.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedRecording.clientName} &bull; {selectedRecording.consultationTitle}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* HTML5 Audio Player */}
              <div className="bg-slate-50 p-4.5 border border-slate-200 rounded-lg space-y-4">
                <audio
                  ref={audioRef}
                  src={selectedRecording.fileUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleAudioEnd}
                  className="hidden"
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xs font-mono font-bold text-slate-500">{formatDuration(currentTime)}</span>
                  {/* Slider progress bar */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleAudioSeek}
                    className="w-full h-1.5 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xs font-mono font-bold text-slate-500">{formatDuration(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={handlePlayPause}
                    className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-100 hover:scale-105 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>
                  <a
                    href={selectedRecording.fileUrl}
                    download={selectedRecording.title}
                    referrerPolicy="no-referrer"
                    className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition"
                    title="Download Audio File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {selectedRecording.description && (
                <div className="space-y-1.5">
                  <span className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-mono">Executive File Description</span>
                  <p className="text-xs text-slate-605 text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {selectedRecording.description}
                  </p>
                </div>
              )}

              {/* Generative AI Summary Segment */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-mono font-bold">AI Summary Reports</h4>
                  {!aiSummary && !aiLoading && (
                    <button
                      onClick={handleTriggerAISummary}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-805 inline-flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate Summaries
                    </button>
                  )}
                </div>

                {aiLoading && (
                  <div className="p-8 text-center bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3.5">
                    <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-indigo-700 font-semibold tracking-wide">AI is analyzing consultation dialogs & context...</p>
                    <p className="text-3xs text-slate-500">Estimating transcribes & compiling action items</p>
                  </div>
                )}

                {aiSummary && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow">
                    {/* Tiny sub tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                      {(['summary', 'keyPoints', 'actions', 'next', 'dialogue'] as const).map(tab => {
                        const label = tab === 'summary' ? 'Summary' : tab === 'keyPoints' ? 'Key Points' : tab === 'actions' ? 'Actions' : tab === 'next' ? 'Next' : 'Dialogue';
                        const target = tab === 'next' ? 'transit' : tab === 'summary' ? 'summary' : tab === 'keyPoints' ? 'keyPoints' : tab === 'actions' ? 'actions' : 'dialogue';
                        return (
                          <button
                            key={tab}
                            onClick={() => setActiveSummaryTab(target)}
                            className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide shrink-0 transition ${
                              activeSummaryTab === target 
                                ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-bold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-4.5 min-h-[140px] text-xs leading-relaxed text-slate-600">
                      {activeSummaryTab === 'summary' && (
                        <p className="whitespace-pre-line text-slate-600 italic">"{aiSummary.summary}"</p>
                      )}
                      
                      {activeSummaryTab === 'keyPoints' && (
                        <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                          {aiSummary.keyPoints.map((kp, i) => (
                            <li key={i}>{kp}</li>
                          ))}
                        </ul>
                      )}

                      {activeSummaryTab === 'actions' && (
                        <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                          {aiSummary.actionItems.map((aiItem, i) => (
                            <li key={i}>{aiItem}</li>
                          ))}
                        </ul>
                      )}

                      {activeSummaryTab === 'transit' && (
                        <p className="text-indigo-700 font-medium whitespace-pre-line">{aiSummary.nextSteps}</p>
                      )}

                      {activeSummaryTab === 'dialogue' && (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                          {aiSummary.transcription.split('\n').map((line, ix) => (
                            <p key={ix} className="pt-1.5 first:pt-0 font-mono text-[10px] leading-relaxed text-slate-500">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!aiSummary && !aiLoading && (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-205 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600/80 mx-auto animate-pulse" />
                    <h5 className="text-xs font-semibold text-slate-900 mt-2.5">Generate Smart AI Brief</h5>
                    <p className="text-3xs text-slate-500 mt-1 leading-normal max-w-[200px] mx-auto">Triggers the Gemini AI to transisize dialogue transcribes, key points, and action markers.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 border-dashed p-10 text-center h-full flex flex-col justify-center">
            <Music className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-900 mt-4">Select an Audio File</h3>
            <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Click any audio recording file row to load the HTML5 player controls or run Gemini summaries.</p>
          </div>
        )}
      </div>

      {/* Upload Modal with File drag and drop */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-xl relative animate-fade-in">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-800">Import Consultation Audio File</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="max-h-[85vh] overflow-y-auto p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-220 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-700 font-medium">{uploadError}</p>
                </div>
              )}

              {/* Consultation Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Consultation Link Reference *</label>
                <select
                  value={uploadConsultationId}
                  onChange={e => setUploadConsultationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                >
                  {consultations.map(con => (
                    <option key={con.id} value={con.id}>{con.title} ({con.clientName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Audio File Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Natal Alignment Alignment Session Recording"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                />
              </div>

              {/* Drag and Drop Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Select Audio File (.mp3, .wav, .m4a) *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
                    dragging ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' :
                    audioFile ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' :
                    'border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-500'
                  }`}
                  onClick={() => document.getElementById('audio-input')?.click()}
                >
                  <input
                    type="file"
                    id="audio-input"
                    className="hidden"
                    accept="audio/mp3,audio/wav,audio/x-m4a,audio/m4a"
                    onChange={handleFileSelect}
                  />
                  {audioFile ? (
                    <div className="space-y-1">
                      <Music className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-900">{audioFile.name}</p>
                      <p className="text-3xs text-slate-555 font-mono">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to load</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-8 h-8 text-indigo-505 text-indigo-500 mx-auto animate-bounce" />
                      <p className="text-sm font-bold text-slate-700">Drag & Drop your audio recording here</p>
                      <p className="text-xs text-slate-500 mt-1">or click to browse local folders</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Description</label>
                  <input
                    type="text"
                    placeholder="Short summary of recording contents..."
                    value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Metadata Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Astrology, Saturn, Plan"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm transition"
                  />
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-bold">Uploading database assets:</span>
                    <span className="text-indigo-700 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-350" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-sm font-semibold rounded-lg text-slate-650 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 inline-flex items-center gap-1 shadow-sm shadow-indigo-100"
                >
                  {submitting ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
