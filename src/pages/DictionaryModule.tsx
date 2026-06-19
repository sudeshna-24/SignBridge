import React, { useState } from 'react';
import { 
  BookMarked,
  Search,
  BookOpen,
  Volume2,
  ChevronRight,
  Sparkles,
  Award,
  BookCheck,
  Check,
  Pause
} from 'lucide-react';
import { HAND_GESTURES_GUIDE } from '../utils/gesturesData';
import { HandGestureGuide } from '../types';
import { generateSpeechApi } from '../services/api';

export default function DictionaryModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Alphabets' | 'Words' | 'Phrases'>('All');
  const [activeGesture, setActiveGesture] = useState<HandGestureGuide | null>(HAND_GESTURES_GUIDE[0]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Filters logic
  const filteredGestures = HAND_GESTURES_GUIDE.filter((gt) => {
    const matchesSearch = gt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gt.descriptionEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          gt.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || gt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Replay speech
  const readAloud = async (text: string, lang: 'English' | 'Hindi', id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(id);

    try {
      const audioData = await generateSpeechApi(text, lang);
      if (audioData.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${audioData.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play();
      } else {
        fallbackVoiceOutput(text, lang);
      }
    } catch (err) {
      console.error(err);
      fallbackVoiceOutput(text, lang);
    }
  };

  const fallbackVoiceOutput = (text: string, lang: 'English' | 'Hindi') => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = lang === 'Hindi' ? 'hi-IN' : 'en-US';
      ut.onend = () => setPlayingId(null);
      ut.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(ut);
    } else {
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left font-sans pb-16">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-cyan-400" />
          Sign Language Encyclopedia & Learning Dictionary
        </h1>
        <p className="text-xs text-gray-400">
          Search sign shapes, review coordinate instructions, and play synthesized voice translations in live English or Devanagari Hindi.
        </p>
      </div>

      {/* Grid search and filters HUD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
        
        {/* Search input (7 cols) */}
        <div className="md:col-span-6 relative flex items-center">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search words, English details, letters or sentences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 hover:border-white/10 focus:border-cyan-400 outline-none transition-all"
          />
        </div>

        {/* Tab categories filters (5 cols) */}
        <div className="md:col-span-6 flex p-0.5 bg-slate-950 rounded-xl border border-white/5 space-x-0.5">
          {(['All', 'Alphabets', 'Words', 'Phrases'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                const firstFound = HAND_GESTURES_GUIDE.find(g => cat === 'All' || g.category === cat);
                if (firstFound) {
                  setActiveGesture(firstFound);
                }
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all outline-none ${
                selectedCategory === cat 
                  ? 'bg-[#141b2e] text-cyan-400 border border-white/5' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Double component section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Listing cards */}
        <div className="lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filteredGestures.length > 0 ? (
            filteredGestures.map((item) => {
              const isActive = activeGesture?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveGesture(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-500/30 text-white' 
                      : 'bg-slate-900/40 border-white/5 text-gray-400 hover:border-white/10 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-1 truncate pr-4">
                    <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono uppercase tracking-widest leading-none block w-max">
                      {item.category}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'translate-x-1 text-cyan-400' : 'text-gray-600'}`} />
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 italic">
              No matching sign descriptors found in encyclopedia database.
            </div>
          )}
        </div>

        {/* Right Side: Active Gesture detail card */}
        <div className="lg:col-span-7">
          {activeGesture ? (
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#13192B] to-[#0A0E1A] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[9px] font-mono font-bold text-cyan-400 rounded bg-cyan-500/10 border border-cyan-500/15 uppercase tracking-wider">
                  {activeGesture.category} Mode
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-bold uppercase">Mapping Mapped</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-heading">{activeGesture.name}</h3>
                <p className="text-cyan-400/80 text-[10px] font-mono tracking-widest uppercase font-bold mt-1">Universal Bridge Guide</p>
              </div>

              {/* English detail */}
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider font-bold">English Instruction:</span>
                  <button
                    onClick={() => readAloud(activeGesture.descriptionEnglish, 'English', activeGesture.id + '_en')}
                    className="p-1 px-2.5 rounded bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 text-[10px] font-bold flex items-center space-x-1 border border-cyan-400/10"
                  >
                    {playingId === activeGesture.id + '_en' ? (
                      <Pause className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>Synthesize Voice</span>
                  </button>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  {activeGesture.descriptionEnglish}
                </p>
              </div>

              {/* Hindi detail */}
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-purple-400 tracking-wider font-bold">Hindi Instruction (हिंदी निर्देश):</span>
                  <button
                    onClick={() => readAloud(activeGesture.descriptionHindi, 'Hindi', activeGesture.id + '_hi')}
                    className="p-1 px-2.5 rounded bg-purple-400/10 hover:bg-purple-400/20 text-purple-400 text-[10px] font-bold flex items-center space-x-1 border border-purple-400/10"
                  >
                    {playingId === activeGesture.id + '_hi' ? (
                      <Pause className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>आवाज सुनें</span>
                  </button>
                </div>
                <p className="text-xs font-sans text-gray-200 leading-relaxed font-semibold">
                  {activeGesture.descriptionHindi}
                </p>
              </div>

              {/* Coordinate checklist */}
              <div className="pt-2 flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-[11px] text-gray-400">
                  Select clean light levels around your hands posture to permit optimal 21 MediaPipe tracking scores.
                </p>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/10 border border-dashed border-white/5 text-center flex flex-col items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-600 mb-2" />
              <p className="text-gray-400 text-xs">Choose a dynamic sign on the left to show instructional coordinates guides.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
