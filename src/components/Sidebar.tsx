import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  Image, 
  Video, 
  History, 
  Settings,
  Activity,
  Hand,
  Home,
  BookOpen,
  Fingerprint
} from 'lucide-react';
import { ActivePage } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const menuItems = [
    { id: 'landing', label: 'Landing Page', icon: Home },
    { id: 'dictionary', label: 'Sign Dictionary', icon: BookOpen },
    { id: 'dashboard', label: 'Translator Studio', icon: LayoutDashboard },
    { id: 'live', label: 'Live Camera', icon: Camera },
    { id: 'image', label: 'Image Upload', icon: Image },
    { id: 'video', label: 'Video Upload', icon: Video },
    { id: 'history', label: 'History Logs', icon: History },
    { id: 'settings', label: 'Preferences', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-[#0A0D1A] border-r border-white/5 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center glow-cyan">
          <Hand className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            SignBridge AI
          </h2>
          <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Universal Node Hub</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none ${
                isActive 
                  ? 'bg-gradient-to-r from-white/10 to-white/[0.02] text-cyan-400 border border-white/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Network / Status Indicator */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div className="truncate">
            <p className="text-xs font-semibold text-gray-200">Local Core Pipeline</p>
            <p className="text-[10px] text-gray-400 font-mono">Status: Connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
