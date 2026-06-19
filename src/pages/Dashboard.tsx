import React, { useState } from 'react';
import { 
  Activity, 
  Hand,
  CheckCircle, 
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  Cpu,
  BookmarkCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { HAND_GESTURES_GUIDE } from '../utils/gesturesData';
import { HandGestureGuide, UserSettings } from '../types';

interface DashboardProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
  totalHistories: number;
}

export default function Dashboard({ settings, setActivePage, totalHistories }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Alphabets' | 'Words' | 'Phrases'>('All');
  const [activeGesture, setActiveGesture] = useState<HandGestureGuide | null>(HAND_GESTURES_GUIDE[0]);

  const filteredGestures = HAND_GESTURES_GUIDE.filter(
    (g) => selectedCategory === 'All' || g.category === selectedCategory
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Hero Banner */}
      <div className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-900/40 via-[#101726]/80 to-[#121B2A] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Translation Model Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-heading">
            Bridging the Gap with Smart Sign Accessibility
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Welcome to <strong className="text-cyan-400">SignBridge AI</strong>, a complete dual-language translation engine that converts live webcam frames, uploaded image assets, and video streams into text and clear natural speech. Designed for real-world peer communication.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActivePage('live')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 active:scale-95 text-xs text-slate-950 font-bold tracking-wide shadow-lg cursor-pointer transition-all duration-150"
            >
              Launch Live Camera
            </button>
            <button
              onClick={() => setActivePage('image')}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white border border-white/10 font-bold tracking-wide transition-all duration-150"
            >
              Translate Image
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl glass-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">Saved Translations</span>
            <BookmarkCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white" id="stat-total-translations">
            {totalHistories}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Stored securely in local database</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">Target Language</span>
            <GraduationCap className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">
            {settings.language}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Synthesizes corresponding voice</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">Inference Engine</span>
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">
            Gemini Flash
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Multi-modal 3.5 context layer</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">Landmarks Track</span>
            <Activity className="w-5 h-5 text-yellow-500 hover:rotate-12 transition-transform duration-150" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">
            21 Points
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">MediaPipe Hands coordinate flow</p>
        </div>
      </div>

      {/* Double Column Area: Dictionary & Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Gesture Dictionary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Hand className="w-5 h-5 text-cyan-400" />
                Sign Language Cheat-Sheet Dictionary
              </h2>
              <p className="text-xs text-gray-400">Click a gesture shape to view specific pose coordinates and Hindi explanation.</p>
            </div>
            {/* Category tabs */}
            <div className="flex p-1 rounded-xl bg-slate-900 border border-white/5 space-x-1 shrink-0">
              {(['All', 'Alphabets', 'Words', 'Phrases'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    selectedCategory === cat 
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* List of gestures */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
              {filteredGestures.map((gt) => {
                const isActive = activeGesture?.id === gt.id;
                return (
                  <button
                    key={gt.id}
                    id={`dict-item-${gt.id}`}
                    onClick={() => setActiveGesture(gt)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      isActive 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                        : 'bg-slate-900/60 border-white/5 text-gray-300 hover:border-white/10 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{gt.name}</h4>
                      <span className="text-[10px] text-gray-500 font-mono tracking-widest">{gt.category}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1 text-cyan-400' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Selected Detail Preview */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col justify-between relative overflow-hidden h-[380px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              {activeGesture ? (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-purple-400/10 border border-purple-500/20 text-[9px] text-purple-400 font-mono uppercase tracking-wider">
                        {activeGesture.category}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">ID: {activeGesture.id}</span>
                    </div>
                    
                    <h3 className="text-base font-bold text-white font-heading">{activeGesture.name}</h3>
                    
                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">English Instruction:</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{activeGesture.descriptionEnglish}</p>
                    </div>

                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-semibold">Hindi Instruction (हिंदी निर्देश):</p>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{activeGesture.descriptionHindi}</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 mt-auto flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    <p className="text-[10px] text-gray-400">Fully compatible with real-time MediaPipe and AI translation models.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <HelpCircle className="w-10 h-10 text-gray-600" />
                  <p className="text-gray-400 text-xs">Select a sign to see coordinate details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Platform Instructions / FAQs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            Quick Guidelines
          </h2>
          
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase border-b border-white/5 pb-2">How to Use</h3>
            
            <div className="space-y-3">
              <div className="flex space-x-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Set Translation Lang</h4>
                  <p className="text-[10px] text-gray-400">Head to Preferences to choose English or Hindi. English outputs standard text; Hindi outputs Devanagari script translations.</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Allow Camera Permissions</h4>
                  <p className="text-[10px] text-gray-400">Open Live Camera mode. Ensure your laptop camera is unlocked to start tracking hand landmarks.</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Position Hand</h4>
                  <p className="text-[10px] text-gray-400">Center your hand in the video stream box. Point fingers clearly to match gestures from the list.</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Export & Share Files</h4>
                  <p className="text-[10px] text-gray-400">Download translations as TXT document or audio MP3 spoken clips, or share with external messaging links instantly.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-yellow-300">Auto-Speech Activated</h4>
              <p className="text-[10px] text-yellow-200/80 leading-relaxed">Ensure you have audio enabled on your browser settings. Translated hands read out speech vocals in clear spoken Hindi or English.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
