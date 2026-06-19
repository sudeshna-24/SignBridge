import React, { useState, useEffect } from 'react';
import { ActivePage, TranslationItem, UserSettings, UserSession } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveCamera from './pages/LiveCamera';
import ImageUpload from './pages/ImageUpload';
import VideoUpload from './pages/VideoUpload';
import HistoryModule from './pages/HistoryModule';
import SettingsModule from './pages/SettingsModule';
import LandingPage from './pages/LandingPage';
import DictionaryModule from './pages/DictionaryModule';
import LoginGate from './pages/LoginGate';
import { fetchSettings, fetchHistory, clearAllHistory, updateSettings } from './services/api';
import { Sparkles, Languages, Activity, Volume2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [userSession, setUserSession] = useState<UserSession>({
    username: '',
    email: '',
    isLoggedIn: false
  });
  const [settings, setSettings] = useState<UserSettings>({
    language: 'English',
    auto_speech: true,
    auto_save: true,
    theme: 'Dark'
  });
  
  const [historyList, setHistoryList] = useState<TranslationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync initialization on mount
  useEffect(() => {
    let active = true;

    const loadPlatformData = async () => {
      try {
        const storedSettings = await fetchSettings();
        const storedHistory = await fetchHistory();
        
        // Load local user session state
        const localSessionStr = localStorage.getItem('user_session_token');
        let localSession = { username: '', email: '', isLoggedIn: false };
        if (localSessionStr) {
          try {
            localSession = JSON.parse(localSessionStr);
          } catch (e) {
            console.error(e);
          }
        }
        
        if (active) {
          setSettings(storedSettings);
          setHistoryList(storedHistory);
          setUserSession(localSession);
        }
      } catch (err) {
        console.error("Failed to fetch initial pipeline databases:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPlatformData();

    return () => {
      active = false;
    };
  }, []);

  // Sync back history deletes
  const handleClearAllHistory = async () => {
    if (window.confirm("Perform database flush? All stored translations will be deleted.")) {
      const fl_success = await clearAllHistory();
      if (fl_success) {
        setHistoryList([]);
      }
    }
  };

  const addTranslationToState = (item: TranslationItem) => {
    setHistoryList((prev) => [item, ...prev]);
  };

  const handleLoginSuccess = (session: UserSession, role: string, avatar: string) => {
    localStorage.setItem('user_session_token', JSON.stringify(session));
    localStorage.setItem('signbridge_role_profile', JSON.stringify({ role, avatar }));
    setUserSession(session);
    setActivePage('landing');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'landing':
      case 'dictionary':
      case 'qa':
        return (
          <LandingPage 
            settings={settings}
            setActivePage={setActivePage}
            historyList={historyList}
            addTranslationToState={addTranslationToState}
            userSession={userSession}
            setUserSession={setUserSession}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            settings={settings} 
            setActivePage={setActivePage} 
            totalHistories={historyList.length} 
          />
        );
      case 'live':
        return (
          <LiveCamera 
            settings={settings} 
            addTranslationToState={addTranslationToState} 
          />
        );
      case 'image':
        return (
          <ImageUpload 
            settings={settings} 
            addTranslationToState={addTranslationToState} 
          />
        );
      case 'video':
        return (
          <VideoUpload 
            settings={settings} 
            addTranslationToState={addTranslationToState} 
          />
        );
      case 'history':
        return (
          <HistoryModule 
            historyList={historyList} 
            setHistoryList={setHistoryList} 
          />
        );
      case 'settings':
        return (
          <SettingsModule 
            settings={settings} 
            setSettings={setSettings} 
            onClearHistory={handleClearAllHistory} 
          />
        );
      default:
        return (
          <LandingPage 
            settings={settings}
            setActivePage={setActivePage}
            historyList={historyList}
            addTranslationToState={addTranslationToState}
            userSession={userSession}
            setUserSession={setUserSession}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <span className="text-[10px] text-cyan-400 font-mono tracking-widest absolute animate-pulse">AI</span>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-gray-200">Initializing SignBridge AI</h2>
          <p className="text-[10px] text-gray-500 font-mono">Aligning SQLite Tables and Speech Models...</p>
        </div>
      </div>
    );
  }

  if (!userSession.isLoggedIn) {
    return <LoginGate onLogin={handleLoginSuccess} />;
  }

  return (
    <div className={`w-screen h-screen bg-[#0B0F19] flex overflow-hidden font-sans ${settings.theme === 'Light' ? 'light-mode' : ''}`}>
      
      {/* Interactive Navigation Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Translation View viewport container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0F19] relative">
        
        {/* Subtle background cosmic glows */}
        <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-purple-500/[0.015] rounded-full blur-3xl pointer-events-none" />

        {/* Global Toolbar Header - Professional Polish Theme */}
        <header className="h-20 px-8 border-b border-white/5 flex items-center justify-between shrink-0 relative z-20 bg-[#0B0F19]/80 backdrop-blur-md">
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-heading flex items-center gap-2">
              SignBridge <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-white/40 text-[10px] font-mono tracking-wide uppercase">
              {activePage === 'dashboard' ? 'Active Accessibility Hub' : `${activePage.replace('_', ' ')} Mode • English-Hindi`}
            </p>
          </div>

          {/* Connected live engine status capsule - Mirroring Mockup Design precisely */}
          <div className="flex items-center gap-4 bg-[#141B2D] px-4 py-2 rounded-full border border-white/5 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Engine Active</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex gap-1.5">
              <button 
                onClick={async () => {
                  const updated = { ...settings, language: 'English' as const };
                  setSettings(updated);
                  await updateSettings({ language: 'English' });
                }}
                className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 outline-none cursor-pointer ${
                  settings.language === 'English' 
                    ? 'bg-cyan-400/10 text-cyan-400 shadow-sm border border-cyan-400/15' 
                    : 'hover:bg-white/5 text-white/40'
                }`}
              >
                EN
              </button>
              <button 
                onClick={async () => {
                  const updated = { ...settings, language: 'Hindi' as const };
                  setSettings(updated);
                  await updateSettings({ language: 'Hindi' });
                }}
                className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 outline-none cursor-pointer ${
                  settings.language === 'Hindi' 
                    ? 'bg-cyan-400/10 text-cyan-400 shadow-sm border border-cyan-400/15' 
                    : 'hover:bg-white/5 text-white/40'
                }`}
              >
                HI
              </button>
            </div>
          </div>

          {/* Profile Session Integration Badge */}
          <div className="flex items-center gap-2">
            {userSession.isLoggedIn ? (
              <div 
                onClick={() => setActivePage('landing')}
                className="flex items-center space-x-2 bg-[#141B2D] border border-white/5 py-2 pl-2 pr-4 rounded-full shadow-inner hover:border-cyan-400/25 transition-all duration-150 cursor-pointer"
                title="View Account Settings"
              >
                <img 
                  src={userSession.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=SignBridge"} 
                  alt="Profile Avatar" 
                  className="w-5.5 h-5.5 rounded-full border border-cyan-400/30 bg-slate-950"
                />
                <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wide">@{userSession.username}</span>
              </div>
            ) : (
              <button 
                onClick={() => setActivePage('landing')}
                className="py-2.5 px-4 rounded-full bg-cyan-400/10 hover:bg-cyan-400/25 border border-cyan-400/20 hover:border-cyan-400/30 text-cyan-400 text-[10px] font-bold transition-all duration-150 flex items-center space-x-1.5"
              >
                <span>Authenticate</span>
              </button>
            )}
          </div>

        </header>

        {/* Central Scrollable Viewport */}
        <section className="flex-1 overflow-y-auto px-8 py-8 relative z-10">
          <div className="max-w-5xl mx-auto h-full">
            {renderActivePage()}
          </div>
        </section>

      </main>
    </div>
  );
}
