import React from 'react';
import { Client, Consultation, Recording } from '../types';
import { Users, Calendar, Video, Clock, TrendingUp, Sparkles, FolderUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart,
  Area
} from 'recharts';

interface DashboardViewProps {
  clients: Client[];
  consultations: Consultation[];
  recordings: Recording[];
  onNavigateTo: (view: string) => void;
  isLoading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  consultations,
  recordings,
  onNavigateTo,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate high-level stats
  const totalClients = clients.length;
  const totalConsultations = consultations.length;
  const totalRecordings = recordings.length;
  
  const completedSessions = consultations.filter(c => c.status === 'Completed').length;
  const scheduledSessions = consultations.filter(c => c.status === 'Scheduled').length;

  // Aggregate monthly trends for Consultations & Recordings
  const parseMonths = () => {
    const monthlyMap: { [key: string]: { month: string; sessions: number; recordings: number } } = {
      'Jan': { month: 'Jan', sessions: 0, recordings: 0 },
      'Feb': { month: 'Feb', sessions: 0, recordings: 0 },
      'Mar': { month: 'Mar', sessions: 0, recordings: 0 },
      'Apr': { month: 'Apr', sessions: 0, recordings: 0 },
      'May': { month: 'May', sessions: 0, recordings: 0 },
      'Jun': { month: 'Jun', sessions: 0, recordings: 0 },
      'Jul': { month: 'Jul', sessions: 0, recordings: 0 },
      'Aug': { month: 'Aug', sessions: 0, recordings: 0 },
      'Sep': { month: 'Sep', sessions: 0, recordings: 0 },
      'Oct': { month: 'Oct', sessions: 0, recordings: 0 },
      'Nov': { month: 'Nov', sessions: 0, recordings: 0 },
      'Dec': { month: 'Dec', sessions: 0, recordings: 0 },
    };

    consultations.forEach(c => {
      try {
        const d = new Date(c.consultationDate);
        const m = d.toLocaleString('en-US', { month: 'short' });
        if (monthlyMap[m]) {
          monthlyMap[m].sessions += 1;
        }
      } catch (e) {}
    });

    recordings.forEach(r => {
      try {
        const d = new Date(r.uploadDate);
        const m = d.toLocaleString('en-US', { month: 'short' });
        if (monthlyMap[m]) {
          monthlyMap[m].recordings += 1;
        }
      } catch (e) {}
    });

    const yearMonthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Filter to the current active range (e.g. showing Jan-Jun)
    return yearMonthsOrder.map(m => monthlyMap[m]).filter(item => item.sessions > 0 || item.recordings > 0);
  };

  const chartData = parseMonths().length > 0 ? parseMonths() : [
    { month: 'Apr', sessions: 1, recordings: 0 },
    { month: 'May', sessions: 2, recordings: 1 },
    { month: 'Jun', sessions: 4, recordings: 3 },
  ];

  // Helper for recording durations
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-sm relative z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/20 to-violet-500/20 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Active Portfolio Health</h1>
            <p className="text-sm text-slate-400 mt-1">Review dashboard logs, audio file transits, and upcoming calendar appointments.</p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button 
              onClick={() => onNavigateTo('Clients')} 
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition"
            >
              Add Clients
            </button>
            <button 
              onClick={() => onNavigateTo('Recordings')} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition inline-flex items-center gap-1.5 shadow-sm shadow-indigo-200"
            >
              <FolderUp className="w-4 h-4" />
              Upload Audio
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Clients</span>
            <h3 className="text-3xl font-display font-black text-slate-900 mt-1.5">{totalClients}</h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Checked active
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Consultations</span>
            <h3 className="text-3xl font-display font-black text-slate-900 mt-1.5">{totalConsultations}</h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{completedSessions}</span> done &bull; <span className="text-indigo-600 font-bold">{scheduledSessions}</span> calendar
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recordings</span>
            <h3 className="text-3xl font-display font-black text-slate-900 mt-1.5">{totalRecordings}</h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> High-fidelity audio
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm">
            <Video className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</span>
            <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate max-w-[150px]">
              {recordings[0]?.title || 'No recent files'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {recordings[0] ? `Uploaded ${new Date(recordings[0].uploadDate).toLocaleDateString()}` : 'Awaiting file imports'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-base font-display font-bold text-slate-900 mb-4">Monthly Consultation Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-base font-display font-bold text-slate-900 mb-4">Monthly Recording Upload Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', fontWeight: 600 }}
                />
                <Bar dataKey="recordings" name="Audio File Uploads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recents Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-bold text-slate-900">Upcoming & Recent Consultations</h3>
            <button onClick={() => onNavigateTo('Consultations')} className="text-xs font-bold text-indigo-650 hover:text-indigo-805">View All</button>
          </div>
          <div className="divide-y divide-slate-100 space-y-3">
            {consultations.slice(0, 4).map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-905 text-slate-900 truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{c.clientName} &bull; {c.consultationType}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold tracking-wide uppercase ${
                    c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 border-emerald-200' :
                    c.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-700 border border-indigo-205 border-indigo-100' :
                    'bg-slate-100 text-slate-655 border border-slate-205 border-slate-200'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500 shrink-0">
                    {new Date(c.consultationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {consultations.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">No scheduled appointments found.</div>
            )}
          </div>
        </div>

        {/* Recent Audio Catalog */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-bold text-slate-900">Recent Recording Uploads</h3>
            <button onClick={() => onNavigateTo('Recordings')} className="text-xs font-bold text-indigo-650 hover:text-indigo-805">View All</button>
          </div>
          <div className="divide-y divide-slate-100 space-y-3">
            {recordings.slice(0, 4).map((r) => (
              <div key={r.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{r.clientName} &bull; {r.consultationTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-slate-900 block font-semibold">
                    {formatDuration(r.duration)}
                  </span>
                  <span className="text-2xs text-slate-550 block mt-0.5">
                    {new Date(r.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {recordings.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">No audio recording uploads detected.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
