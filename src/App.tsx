import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ConsultationsView } from './components/ConsultationsView';
import { RecordingsView } from './components/RecordingsView';
import { NotesView } from './components/NotesView';
import { SettingsView } from './components/SettingsView';
import { Client, Consultation, Recording, Note } from './types';
import api from './services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Users, 
  Calendar, 
  Music, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Menu, 
  X, 
  User as UserIcon, 
  ChevronDown, 
  Bell,
  Sparkles
} from 'lucide-react';

const SidebarMenuMap = [
  { name: 'Dashboard', icon: Activity },
  { name: 'Clients', icon: Users },
  { name: 'Consultations', icon: Calendar },
  { name: 'Recordings', icon: Music },
  { name: 'Notes', icon: FileText },
  { name: 'Settings', icon: SettingsIcon },
];

const MainAppContent: React.FC = () => {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Global datasets
  const [clients, setClients] = useState<Client[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Global search text
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch all databases in parallel
  const refreshAllData = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const [clsRes, conRes, recRes, noteRes] = await Promise.all([
        api.get('/clients'),
        api.get('/consultations'),
        api.get('/recordings'),
        api.get('/notes')
      ]);

      setClients(clsRes.data);
      setConsultations(conRes.data);
      setRecordings(recRes.data);
      setNotes(noteRes.data);
    } catch (e) {
      console.error('Failed to pull backend portfolio data', e);
    } finally {
      setDataLoading(false);
    }
  };

  // Sync datasets on token change or activeTab switch for fresh states
  useEffect(() => {
    if (token) {
      refreshAllData();
    }
  }, [token, activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-xs font-semibold tracking-wider uppercase font-mono">Authenticating System...</span>
      </div>
    );
  }

  // Not logged in -> Show portal onboarding directly
  if (!user || !token) {
    return <AuthLayout />;
  }

  // Handle global search redirects
  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGlobalSearch(val);

    // Dynamic focus redirection based on matched targets
    const lower = val.toLowerCase();
    if (lower.startsWith('rec:')) {
      setActiveTab('Recordings');
    } else if (lower.startsWith('note:')) {
      setActiveTab('Notes');
    } else if (lower.startsWith('con:')) {
      setActiveTab('Consultations');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative font-sans overflow-x-hidden">

      {/* Main Layout Row */}
      <div className="flex flex-1 relative">
        
        {/* Mobile Sidebar Slide Over Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Component */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Brand header */}
          <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow shadow-indigo-605/10">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">ConsulTrack</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {SidebarMenuMap.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeTab === menu.name;
              return (
                <button
                  key={menu.name}
                  onClick={() => {
                    setActiveTab(menu.name);
                    setSidebarOpen(false);
                    setGlobalSearch('');
                  }}
                  id={`nav-${menu.name.toLowerCase()}`}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-400 font-medium' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {menu.name}
                </button>
              );
            })}
          </nav>

          {/* User Signout footer block */}
          <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Panel Content (App master) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen relative z-10">
          
          {/* Top master Navigation Bar */}
          <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
            {/* Left hamburger toggler */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-base font-display font-extrabold text-slate-900 hidden sm:block tracking-tight">
                {activeTab} Workspace
              </h2>
            </div>

            {/* Middle Global Searching bar */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Search clients, recordings, or consultations..."
                value={globalSearch}
                onChange={handleGlobalSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-slate-201 border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
              />
            </div>

            {/* Right profiling drawer triggers */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition hidden md:block relative">
                <Bell className="w-6 h-6" />
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full absolute top-2.5 right-2.5" />
              </button>
              <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 p-1.5 text-slate-700 hover:text-slate-900 rounded-xl transition text-sm"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">Consultation Partner</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-white shadow-sm shrink-0">
                    {user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-fade-in text-xs font-medium text-slate-700">
                      <button 
                        onClick={() => { setActiveTab('Settings'); setProfileOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 hover:text-slate-950 transition flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Settings Panel
                      </button>
                      <button 
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main workspace frame container */}
          <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'Dashboard' && (
                  <DashboardView
                    clients={clients}
                    consultations={consultations}
                    recordings={recordings}
                    onNavigateTo={(view) => setActiveTab(view)}
                    isLoading={dataLoading}
                  />
                )}
                {activeTab === 'Clients' && (
                  <ClientsView
                    clients={clients}
                    consultations={consultations}
                    recordings={recordings}
                    notes={notes}
                    onRefresh={refreshAllData}
                  />
                )}
                {activeTab === 'Consultations' && (
                  <ConsultationsView
                    consultations={consultations}
                    clients={clients}
                    onRefresh={refreshAllData}
                    onNavigateTo={(view) => setActiveTab(view)}
                  />
                )}
                {activeTab === 'Recordings' && (
                  <RecordingsView
                    recordings={recordings}
                    consultations={consultations}
                    onRefresh={refreshAllData}
                    onNavigateTo={(view) => setActiveTab(view)}
                  />
                )}
                {activeTab === 'Notes' && (
                  <NotesView
                    notes={notes}
                    consultations={consultations}
                    onRefresh={refreshAllData}
                    onNavigateTo={(view) => setActiveTab(view)}
                  />
                )}
                {activeTab === 'Settings' && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
