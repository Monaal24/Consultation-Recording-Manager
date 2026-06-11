import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, Eye, HelpCircle, HardDrive, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile details */}
      <div className="bg-slate-800 rounded-2xl border border-slate-705/30 p-6 space-y-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 font-bold text-xl flex items-center justify-center shadow-lg">
            {user?.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'P'}
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white tracking-tight">{user?.name || 'Professional Portfolio'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active session &bull; Standard Consultant Profile</p>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-5 space-y-4">
          <h4 className="text-2xs font-extrabold text-slate-450 uppercase tracking-widest block font-bold">Profile Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span className="text-3xs text-slate-500 font-bold uppercase block mb-1">Authenticated Account Name</span>
              <div className="p-3 bg-slate-900/40 border border-slate-750 text-slate-300 text-xs rounded-xl font-medium select-all">
                {user?.name}
              </div>
            </div>
            <div>
              <span className="text-3xs text-slate-500 font-bold uppercase block mb-1">Registered Contact Email</span>
              <div className="p-3 bg-slate-900/40 border border-slate-750 text-slate-300 text-xs rounded-xl font-medium select-all">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Credentials */}
      <div className="bg-slate-800 rounded-2xl border border-slate-705/30 p-6 space-y-4 shadow-md">
        <h4 className="text-2xs font-extrabold text-slate-455 uppercase tracking-widest block font-bold inline-flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-indigo-405" /> Security & JWT Infrastructure
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Consultation Recording Manager protects client confidentiality. Session tokens are generated on the secure Express server using HS256 password hashing protocols.
        </p>

        <div className="p-4 bg-indigo-500/10 border border-indigo-500/15 rounded-xl flex items-start gap-3">
          <Key className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-indigo-200 space-y-1 leading-normal">
            <span className="font-semibold block text-indigo-300">Confidential Session Guard active:</span>
            <span>JSON Web Tokens expire automatically every 7 days. Close browser windows or click 'Sign Out' to force destroy the active session parameters on local machines.</span>
          </div>
        </div>
      </div>

      {/* Cloud Drive storage status */}
      <div className="bg-slate-800 rounded-2xl border border-slate-705/30 p-6 space-y-4 shadow-md">
        <h4 className="text-2xs font-extrabold text-slate-455 uppercase tracking-widest block font-bold inline-flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-violet-405" /> Audio Disk Storage quota
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-350">
          <span>Active local directory: <span className="font-mono text-slate-400">/uploads</span></span>
          <span className="font-mono text-violet-300 text-2xs font-bold uppercase bg-violet-600/10 px-2 py-0.5 rounded border border-violet-500/15">Unlimited Quota</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-indigo-505 h-full w-[17%]" />
        </div>
        <p className="text-3xs text-slate-500 leading-relaxed">
          Recordings are processed dynamically within the sandboxed Cloud Run server container. File modifications are persisted on disk under relative paths mapped statically during boot processes.
        </p>
      </div>

      {/* Help Block */}
      <div className="bg-slate-900/30 rounded-2xl border border-slate-750 p-6 space-y-3">
        <h5 className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5">
          <HelpCircle className="w-4.5 h-4.5 text-slate-400" /> Need Assistance?
        </h5>
        <p className="text-xs text-slate-400 leading-relaxed">
          For technical onboarding workflows, setting custom Gemini API keys, mounting custom database endpoints, or reporting security parameters, review the documentation files at the root of the project drive workspace.
        </p>
      </div>
    </div>
  );
};
