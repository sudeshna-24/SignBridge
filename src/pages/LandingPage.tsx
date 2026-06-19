import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Hand, 
  User, 
  LogIn, 
  LogOut, 
  Search, 
  BookOpen,
  Library,
  HelpCircle, 
  History, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Check, 
  MessageSquare, 
  Cpu, 
  ShieldCheck, 
  Camera, 
  Image as ImageIcon, 
  Video as VideoIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { HAND_GESTURES_GUIDE } from '../utils/gesturesData';
import { HandGestureGuide, UserSettings, TranslationItem, UserSession } from '../types';
import { askAiQuestionApi, generateSpeechApi } from '../services/api';
import GestureIllustration from '../components/GestureIllustration';
import ReactMarkdown from 'react-markdown';

interface LandingPageProps {
  settings: UserSettings;
  setActivePage: (page: any) => void;
  historyList: TranslationItem[];
  addTranslationToState: (item: TranslationItem) => void;
  userSession: UserSession;
  setUserSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

export default function LandingPage({ 
  settings, 
  setActivePage, 
  historyList,
  addTranslationToState,
  userSession,
  setUserSession
}: LandingPageProps) {
  
  // --- STATE FOR AUTHENTICATION SYSTEM ---
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [userRole, setUserRole] = useState('Curious Learner');
  const [selectedAvatar, setSelectedAvatar] = useState('🎓');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');

  // --- STATE FOR DICTIONARY SYSTEM ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Alphabets' | 'Words' | 'Phrases'>('All');
  const [activeDictItem, setActiveDictItem] = useState<HandGestureGuide | null>(HAND_GESTURES_GUIDE[0]);
  const [playingDictAudioId, setPlayingDictAudioId] = useState<string | null>(null);

  // --- STATE FOR Q&A ADVISOR CHATBOT ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; timestamp: Date }>>([
    {
      sender: 'assistant',
      text: "👋 Hello! I am the **SignBridge AI Assistant**. Ask me anything about American/Indian Sign Language, hand gestures, 21-tracking points, or how our live translation pipeline handles video frames!",
      timestamp: new Date()
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Suggested quick prompts adapted to current active companion role
  const getQuickPromptsByRole = (role: string) => {
    switch (role) {
      case 'Speech Therapist':
        return [
          "How does sign language aid child therapy?",
          "Suggest home motor coordination exercises",
          "What is optimal hand position tracking?",
          "Tell me about muscle node articulation"
        ];
      case 'Accessibility Dev':
        return [
          "How to parse landmarks JSON",
          "What is live tracking CPU latency?",
          "Define 21 standard keypoint indices",
          "How does the dev API proxy work?"
        ];
      case 'Sign Language Mentor':
        return [
          "Teach Devanagari numbering signs",
          "Assess hand model landmark stability",
          "Explain double handed signs combo",
          "List gesture teaching exercises"
        ];
      case 'Community Member':
      case 'Community Advocate':
        return [
          "How to run accessible school programs?",
          "Aids for community integration signs",
          "Find standard sign dictionaries",
          "Universal vs local hand gestures"
        ];
      case 'Curious Learner':
      default:
        return [
          "How to sign 'Namaste'?",
          "What are the 21 tracking landmarks?",
          "How to improve camera translation?",
          "Can it read two hands simultaneously?"
        ];
    }
  };

  const quickPrompts = getQuickPromptsByRole(userRole);

  // Load persistent user profile from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('signbridge_role_profile');
    if (savedRole) {
      try {
        const parsed = JSON.parse(savedRole);
        setUserRole(parsed.role || 'Curious Learner');
        setSelectedAvatar(parsed.avatar || '🎓');
      } catch (e) {
        console.error("Error loading cached role profile", e);
      }
    }
    if (userSession.isLoggedIn) {
      setFormUsername(userSession.username || '');
      setFormEmail(userSession.email || '');
    }
  }, [userSession]);

  // Scroll Q&A bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle simulated login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim()) {
      setLoginError('Please enter a user name.');
      return;
    }
    const profile = {
      username: formUsername.trim(),
      email: formEmail.trim() || 'user@signbridge.ai',
      isLoggedIn: true,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formUsername.trim())}`
    };
    localStorage.setItem('user_session_token', JSON.stringify(profile));
    localStorage.setItem('signbridge_role_profile', JSON.stringify({
      role: userRole,
      avatar: selectedAvatar
    }));

    setUserSession(profile);
    setShowLoginModal(false);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session_token');
    localStorage.removeItem('signbridge_role_profile');
    setUserSession({
      username: '',
      email: '',
      isLoggedIn: false
    });
    setFormUsername('');
    setFormEmail('');
    setUserRole('Curious Learner');
    setSelectedAvatar('🎓');
  };

  // --- TTS VOICE SYNTHESIS FOR DICTIONARY & HISTORY ---
  const handleSynthesizeDictItem = async (text: string, id: string) => {
    setPlayingDictAudioId(id);
    try {
      const res = await generateSpeechApi(text, settings.language);
      if (res.audioBase64) {
        const audioSrc = `data:audio/mpeg;base64,${res.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setPlayingDictAudioId(null);
        audio.onerror = () => setPlayingDictAudioId(null);
        audio.play();
      } else {
        // Fallback standard speechSynthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.language === 'Hindi' ? 'hi-IN' : 'en-US';
        utterance.onend = () => setPlayingDictAudioId(null);
        utterance.onerror = () => setPlayingDictAudioId(null);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Error generating dict TTS speech:", err);
      setPlayingDictAudioId(null);
    }
  };

  // --- Q&A SUBMISSION HANDLER ---
  const handleSendChat = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to state
    const userMsg = { sender: 'user' as const, text: text.trim(), timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiRes = await askAiQuestionApi(text.trim(), activeDictItem?.category, userRole);
      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: apiRes.answer || "I could not find an answer for that gesture parameter.",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error("Error calling Q&A advisor:", err);
      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        text: "🚨 Sorry! The SignBridge AI server is currently busy calibrating. Please ask again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filter dictionary items
  const filteredDictItems = HAND_GESTURES_GUIDE.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.descriptionEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.descriptionHindi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 pb-16 animate-fadeIn text-slate-100">
      
      {/* 1. HERO BRAND BANNER & MEMBER PROFILE OVERVIEW */}
      <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden bg-gradient-to-br from-[#121B31] via-[#0E1527] to-[#0A0D1A] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SignBridge Core v1.4 Premium</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-heading">
              Elevating <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Sign Language</span><br />
              With Live MediaPipe Translations
            </h1>
            
            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl">
              An intelligent, full-stack, dual-language translator designed for instantaneous accessibility. Convert client gestures, custom image assets, and sequence videos in real-time. Designed with natural Hindi & English speech voices.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => setActivePage('live')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 active:scale-95 text-xs text-slate-950 font-bold tracking-wider shadow-lg shadow-cyan-400/10 flex items-center gap-2 cursor-pointer transition-all duration-150"
              >
                <Camera className="w-4 h-4" />
                Launch Live Camera Translate
              </button>
              <button
                onClick={() => setActivePage('image')}
                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white border border-white/10 font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Analyze Images
              </button>
              <button
                onClick={() => setActivePage('video')}
                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white border border-white/10 font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-2"
              >
                <VideoIcon className="w-4 h-4" />
                Decompose Videos
              </button>
            </div>
          </div>

          {/* RIGHT COL: ATTRACTIVE INTERACTIVE ACCOUNT / LOGIN CARD */}
          <div className="lg:col-span-4 lg:pl-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#22D3EE] uppercase font-bold">User Membership</span>
                <span className={`w-2 h-2 rounded-full ${userSession.isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              </div>

              {!userSession.isLoggedIn ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Join SignBridge Portal</h3>
                    <p className="text-[11px] text-gray-400 mt-1">Unlock saved histories and personal accessibility role-tags.</p>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-900 font-bold text-xs hover:bg-cyan-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Log In Securely
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                      {selectedAvatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {userSession.username}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 font-bold uppercase">{userRole}</span>
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{userSession.email}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Inference Actions:</span>
                      <span className="text-white font-bold">{historyList.length} total</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">Authenticated <Check className="w-3 h-3" /></span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl bg-[#201026]/40 hover:bg-[#32133f]/40 text-rose-300 border border-rose-500/15 font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out Account
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE SUMMARY / PAST HISTORY FEED (TO SHOW WHAT THEY DONE PASTLY) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-heading">
              <History className="w-6 h-6 text-purple-400" />
              Chronological Past Translations History
            </h2>
            <p className="text-xs text-gray-400">Review success indicators and real-world inputs completed in your previous workspace sessions.</p>
          </div>
          <button 
            onClick={() => setActivePage('history')}
            className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
          >
            Manage Databases
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {historyList.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
              <History className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300">No Past Logs Found</p>
              <p className="text-[10px] text-gray-500 mt-1">Open the Live Camera or Translate an Image to write translation history.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {historyList.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/25 transition-all text-left space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    item.input_type === 'live_camera' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20' :
                    item.input_type === 'image_upload' ? 'bg-purple-500/10 text-purple-400 border border-purple-400/20' :
                    'bg-yellow-500/10 text-yellow-400 border border-yellow-400/20'
                  }`}>
                    {item.input_type.replace('_', ' ')}
                  </span>
                  
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <p className="text-gray-400 text-[10px] font-mono tracking-wider uppercase">Extracted Translation</p>
                  <p className="text-white text-sm font-bold mt-1 line-clamp-2">{item.extracted_text}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] font-bold text-emerald-400">{Math.round(item.confidence * 100)}% Match</span>
                  </div>

                  <button
                    onClick={() => handleSynthesizeDictItem(item.extracted_text, item.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors"
                    title="Vocalize Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE SEARCHABLE SIGN DICTIONARY SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DICTIONARY FILTER AND CARDS (COL SPAN 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-heading">
              <Library className="w-6 h-6 text-[#22D3EE]" />
              AI Universal Sign Lexicon & Learning Vault
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Scan sign visual cues, learn correct finger node position overlays, and synthesize audio feedback in real-time.
            </p>
          </div>

          {/* Search + Category Tabs */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search gesture name, definitions, english keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-cyan-400/30 rounded-xl text-xs placeholder:text-gray-500 focus:outline-none transition-all text-slate-100"
              />
            </div>

            <div className="flex flex-wrap p-1 rounded-xl bg-slate-950 border border-white/5 gap-1">
              {(['All', 'Alphabets', 'Words', 'Phrases'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 transition-all duration-150 cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-cyan-400 text-slate-950 font-bold' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
            {filteredDictItems.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-gray-500">
                <Info className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs">No signs matching "{searchQuery}" detected.</p>
              </div>
            ) : (
              filteredDictItems.map((item) => {
                const isActive = activeDictItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveDictItem(item)}
                    className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-950/20 to-slate-900 border-cyan-400/30 shadow-inner shadow-cyan-400/5' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xs font-bold ${isActive ? 'text-cyan-400' : 'text-white'}`}>{item.name}</h4>
                      <span className="text-[9px] text-gray-500 uppercase tracking-wide mt-1.5 block">{item.category}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-gray-500'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DICTIONARY DETAILED VIEWER (COL SPAN 5) */}
        <div className="lg:col-span-5">
          {activeDictItem ? (
            <div className="p-6 rounded-2xl border border-white/5 bg-[#101625] shadow-2xl relative space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#22D3EE] uppercase font-bold text-left">Sign Info details</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-gray-400">{activeDictItem.category}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center text-cyan-400 font-bold">
                    <Hand className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#F8FAFC] text-base leading-tight text-left">{activeDictItem.name}</h3>
                    <p className="text-[10px] text-gray-500 text-left">Standard Sign language pose configuration</p>
                  </div>
                </div>

                {/* Interactive sign language skeleton illustration with annotations */}
                <div className="py-3 flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                  <GestureIllustration id={activeDictItem.id} />
                  <span className="text-[9px] font-mono tracking-widest text-[#22D3EE] uppercase font-bold animate-pulse">
                    NODE SKELETON SCHEMATIC
                  </span>
                </div>

                <div className="space-y-3 text-left">
                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                    <h5 className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase font-bold">English Description</h5>
                    <p className="text-gray-300 text-xs leading-relaxed mt-1">{activeDictItem.descriptionEnglish}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                    <h5 className="text-[9px] font-mono tracking-widest text-purple-400 uppercase font-bold">Hindi Translation (हिंदी विवरण)</h5>
                    <p className="text-gray-300 text-xs leading-relaxed mt-1 font-hindi">{activeDictItem.descriptionHindi}</p>
                  </div>
                </div>

                {/* Synthesis trigger */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleSynthesizeDictItem(activeDictItem.descriptionEnglish, `dict-en-${activeDictItem.id}`)}
                    disabled={playingDictAudioId !== null}
                    className="flex-1 py-3 rounded-xl bg-cyan-405/5 hover:bg-cyan-400/10 border border-cyan-400/15 text-cyan-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {playingDictAudioId === `dict-en-${activeDictItem.id}` ? 'Vocalizing En...' : 'Speak English'}
                  </button>

                  <button
                    onClick={() => handleSynthesizeDictItem(activeDictItem.descriptionHindi, `dict-hi-${activeDictItem.id}`)}
                    disabled={playingDictAudioId !== null}
                    className="flex-1 py-3 rounded-xl bg-purple-405/5 hover:bg-purple-400/10 border border-purple-400/15 text-purple-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    {playingDictAudioId === `dict-hi-${activeDictItem.id}` ? 'Vocalizing Hi...' : 'Speak Hindi'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-slate-900/10 flex items-center justify-center text-center h-[300px]">
              <p className="text-xs text-gray-500">Pick a Sign Gesture from the list to display interactive guidelines.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI SIGN LANGUAGE CHATBOT / Q&A ADVISOR */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/20 via-[#11182B] to-slate-900 border border-white/5 space-y-6 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5 animate-pulse text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-white text-lg">AI Sign Language Advisor & Companion</h3>
            <p className="text-xs text-gray-400">Ask questions about coordinate landmarks, gesture translations, or specific signage methods.</p>
          </div>
        </div>

        {/* Chat message logs */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 h-[340px] overflow-y-auto space-y-4">
          {chatMessages.map((msg, i) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div 
                key={i} 
                className={`flex gap-3 text-left ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-mono select-none shrink-0">
                    AI
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isBot 
                    ? 'bg-[#151C30] text-gray-200 border border-white/5 rounded-tl-none' 
                    : 'bg-cyan-500 text-slate-950 font-semibold rounded-tr-none'
                }`}>
                  {isBot ? (
                    <div className="markdown-body text-gray-200">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-slate-950">{msg.text}</p>
                  )}
                  <span className={`text-[9px] block text-right font-mono ${isBot ? 'text-gray-500' : 'text-slate-900/60'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {isChatLoading && (
            <div className="flex gap-3 text-left justify-start">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-mono select-none shrink-0 animate-spin">
                ⏳
              </div>
              <div className="bg-[#151C30] text-gray-400 border border-white/5 rounded-2xl rounded-tl-none p-4 text-xs animate-pulse">
                SignBridge AI is generating answers...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-2 text-left">
          <span className="text-[10px] text-gray-500 font-mono self-center">Suggestions:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(p)}
              disabled={isChatLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-[10px] text-gray-300 font-semibold hover:text-white transition-all cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Action input line */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat(chatInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Type your question here (e.g. 'How do I do Thumbs Down sign in English?')..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/5 focus:border-purple-500/30 rounded-xl text-xs placeholder:text-gray-500 focus:outline-none transition-all text-slate-100"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 disabled:text-gray-500 font-bold text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            Ask AI
          </button>
        </form>
      </div>

      {/* --- MEMBERSHIP LOGIN DIALOG MODAL --- */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#111625] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer"
            >
              &times;
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5 text-cyan-400" />
                SignBridge Member Login
              </h3>
              <p className="text-xs text-gray-400">Establish credential tags for customized reporting outputs.</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold">User Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sudeshna Roy"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold">Your Companion Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400/30"
                >
                  <option value="Curious Learner">Curious Learner</option>
                  <option value="Sign Language Mentor">Sign Language Mentor</option>
                  <option value="Community Member">Community Advocate</option>
                  <option value="Speech Therapist">Speech Therapist</option>
                  <option value="Accessibility Dev">Accessibility Dev</option>
                </select>
              </div>

              {/* Avatar Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold block">Select Custom Avatar</label>
                <div className="flex gap-2.5 justify-between py-1">
                  {['🎓', '🌟', '🤟', '🤝', '🦋', '🩺'].map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-11 h-11 rounded-xl text-lg flex items-center justify-center transition-all border cursor-pointer ${
                        selectedAvatar === av 
                          ? 'bg-cyan-500/20 border-cyan-400 text-white scale-110 shadow-lg' 
                          : 'bg-slate-950 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold text-xs hover:from-cyan-300 hover:to-cyan-400 transition-all cursor-pointer shadow-lg mt-2"
              >
                Log In Securely
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
