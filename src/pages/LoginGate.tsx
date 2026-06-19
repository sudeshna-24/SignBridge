import React, { useState } from 'react';
import { UserSession } from '../types';
import { LogIn, Info, ShieldCheck, Hand } from 'lucide-react';

interface LoginGateProps {
  onLogin: (session: UserSession, role: string, avatar: string) => void;
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Curious Learner');
  const [avatar, setAvatar] = useState('🎓');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required to access the SignBridge core processor.');
      return;
    }
    
    const profile: UserSession = {
      username: username.trim(),
      email: email.trim() || 'user@signbridge.ai',
      isLoggedIn: true,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username.trim())}`
    };

    onLogin(profile, role, avatar);
  };

  return (
    <div className="w-screen h-screen bg-[#060814] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Decorative cyber backdrop bubbles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-indigo-500/[0.015] blur-[150px] pointer-events-none" />

      {/* Futuristic Gate Layout Card */}
      <div className="w-full max-w-lg bg-[#0F1322]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative z-10 space-y-8 animate-fadeIn">
        
        {/* Animated glowing top emblem */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.25)] border border-cyan-400/20 relative group">
            <Hand className="w-6 h-6 text-white animate-pulse" />
            <div className="absolute inset-x-0 -bottom-1 h-px bg-cyan-400/40 w-1/2 mx-auto blur-[1px]" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
              SignBridge <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Interactive Sign Language Translation & AI Learning Hub
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-widest text-[#22D3EE] uppercase font-extrabold">
              Operator Username *
            </label>
            <input
              type="text"
              placeholder="e.g. Sudeshna Roy"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4.5 py-3.5 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-slate-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400/30 transition-all shadow-inner font-sans font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-extrabold">
              Credentials Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. user@signbridge.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4.5 py-3.5 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-slate-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400/30 transition-all shadow-inner font-sans"
            />
          </div>

          {/* Dual row system settings options: Companion Role & Custom Avatar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-extrabold">
                Your Professional Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400/30 transition-all font-sans"
              >
                <option value="Curious Learner">Curious Learner</option>
                <option value="Sign Language Mentor">Sign Language Mentor</option>
                <option value="Community Member">Community Advocate</option>
                <option value="Speech Therapist">Speech Therapist</option>
                <option value="Accessibility Dev">Accessibility Dev</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-extrabold block">
                Select Custom Avatar
              </label>
              <div className="flex gap-2.5 justify-between py-1 bg-slate-950/80 border border-white/5 rounded-xl px-2.5">
                {['🎓', '🌟', '🤟', '🤝', '🦋', '🩺'].map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-all border cursor-pointer ${
                      avatar === av 
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-white scale-110 shadow-md' 
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs hover:from-cyan-300 hover:to-indigo-400 transition-all duration-300 shadow-[0_4px_20px_rgba(34,211,238,0.15)] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              Initialize Portal Workspace
            </button>
          </div>

        </form>

        {/* Security & Platform Compliance Banner */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]/60" />
          <span>REAL-TIME COGNITIVE CLOUD HAND TRACKING STATUS ACTIVE</span>
        </div>

      </div>

    </div>
  );
}
