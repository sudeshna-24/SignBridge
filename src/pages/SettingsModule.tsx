import React, { useState } from 'react';
import { 
  Settings, 
  Languages, 
  Volume2, 
  Bookmark, 
  Trash2, 
  Palette,
  ShieldAlert,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { updateSettings } from '../services/api';
import { UserSettings } from '../types';

interface SettingsModuleProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onClearHistory: () => void;
}

export default function SettingsModule({ settings, setSettings, onClearHistory }: SettingsModuleProps) {
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'system'>('preferences');

  const handleLanguageChange = async (lang: 'English' | 'Hindi') => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    await updateSettings({ language: lang });
    triggerSaveFeedback();
  };

  const toggleAutoSpeech = async () => {
    const updated = { ...settings, auto_speech: !settings.auto_speech };
    setSettings(updated);
    await updateSettings({ auto_speech: updated.auto_speech });
    triggerSaveFeedback();
  };

  const toggleAutoSave = async () => {
    const updated = { ...settings, auto_save: !settings.auto_save };
    setSettings(updated);
    await updateSettings({ auto_save: updated.auto_save });
    triggerSaveFeedback();
  };

  const handleThemeChange = async (theme: 'Dark' | 'Light') => {
    const updated = { ...settings, theme: theme };
    setSettings(updated);
    await updateSettings({ theme: theme });
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
          Platform Preferences
        </h1>
        <p className="text-xs text-gray-400">Configure SignBridge AI active languages, auto audio readouts, data writing behaviors, and system engine secrets integration.</p>
      </div>

      {/* Settings Navigation */}
      <div className="flex border-b border-white/5 space-x-6 pb-px">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all outline-none cursor-pointer ${
            activeTab === 'preferences' 
              ? 'border-cyan-400 text-cyan-400 font-extrabold' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          General & Language Preferences
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all outline-none cursor-pointer ${
            activeTab === 'system' 
              ? 'border-cyan-400 text-cyan-400 font-extrabold' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          AI Pipeline & Secrets Guide
        </button>
      </div>

      {activeTab === 'preferences' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-6">
          
          {/* Main Controls Panel (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              
              {/* Language Selection */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Languages className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-200">Active Translation Language</h3>
                    <p className="text-[10px] text-gray-400">Select which dialect the signer translating model outputs text and vocal speech into.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <button
                    onClick={() => handleLanguageChange('English')}
                    className={`p-4 rounded-xl text-left border flex items-center justify-between transition-all outline-none ${
                      settings.language === 'English'
                        ? 'bg-cyan-500/10 border-cyan-400 text-white'
                        : 'bg-slate-950/40 border-white/5 text-gray-400 hover:border-white/10 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">English Mode</h4>
                      <p className="text-[10px] text-gray-500 font-mono">Standard Roman letters sound output</p>
                    </div>
                    {settings.language === 'English' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => handleLanguageChange('Hindi')}
                    className={`p-4 rounded-xl text-left border flex items-center justify-between transition-all outline-none ${
                      settings.language === 'Hindi'
                        ? 'bg-cyan-500/10 border-cyan-400 text-white'
                        : 'bg-slate-950/40 border-white/5 text-gray-400 hover:border-white/10 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">हिंदी माध्यम (Hindi Mode)</h4>
                      <p className="text-[10px] text-gray-500 font-mono">देवनागरी लिपि और स्थानीय उच्चारण</p>
                    </div>
                    {settings.language === 'Hindi' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>

              {/* Speech & Caching Preferences */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-mono text-cyan-400 tracking-wider uppercase">Auto-Pilot Triggers</h3>
                
                <div className="space-y-4">
                  {/* Auto Speech Readout toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-950/30 rounded-xl border border-white/5">
                    <div className="flex space-x-3.5">
                      <Volume2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Instant Text-To-Speech Readout</h4>
                        <p className="text-[10px] text-gray-400">SpeaksTranslated gestures aloud instantly as hands are recognized in Webcam live box.</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleAutoSpeech}
                      id="toggle-auto-speech"
                      className={`w-11 h-6 rounded-full relative transition-all duration-300 outline-none cursor-pointer ${
                        settings.auto_speech ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.auto_speech ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Auto Save Item toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-950/30 rounded-xl border border-white/5">
                    <div className="flex space-x-3.5">
                      <Bookmark className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Persistent Caching History</h4>
                        <p className="text-[10px] text-gray-400">Writes translations automatically to persistent SQLite schemas on recognition.</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleAutoSave}
                      id="toggle-auto-save"
                      className={`w-11 h-6 rounded-full relative transition-all duration-300 outline-none cursor-pointer ${
                        settings.auto_save ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.auto_save ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Settings Selection */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start space-x-3">
                  <Palette className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-200">Graphic Theme Aspect</h3>
                    <p className="text-[10px] text-gray-400">SignBridge AI is optimized using our ambient Space Vision dark palette. Light theme fits basic layouts.</p>
                  </div>
                </div>

                <div className="flex p-0.5 bg-slate-950 rounded-xl border border-white/5 max-w-[240px]">
                  <button
                    onClick={() => handleThemeChange('Dark')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all outline-none cursor-pointer ${
                      settings.theme === 'Dark'
                        ? 'bg-[#141b2e] text-cyan-400'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Cosmic Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('Light')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all outline-none cursor-pointer ${
                      settings.theme === 'Light'
                        ? 'bg-[#141b2e] text-cyan-400'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Classic Light
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Stats Actions Drawer Panel (Right 1 column) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">Maintenance</h2>
            
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-white">Database Control</h3>
              <p className="text-[10px] text-gray-400 leading-normal">Erase previous translations caches cleanly from memory tables if storage space is loaded.</p>
              
              <button
                onClick={onClearHistory}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center space-x-2 transition-all outline-none cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete History database</span>
              </button>
            </div>

            {/* Save indicator float alert */}
            {saveFeedback && (
              <div className="p-3.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center space-x-2.5 text-xs text-cyan-400 animate-slideUp">
                <Check className="w-4 h-4" />
                <span className="font-semibold">Preferences synced successfully!</span>
              </div>
            )}
          </div>

        </div>
      ) : (
        // System Secrets and Architecture Guides
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-6 max-w-3xl animate-fadeIn">
          
          <div className="flex items-start space-[#141B2D] space-x-4">
            <AlertCircle className="w-6 h-6 text-cyan-400 shrink-0" />
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white font-heading">SignBridge Full-Stack Pipeline Orchestrations</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                The platform utilizes <strong className="text-cyan-400 font-semibold font-sans">Vite + React 19</strong> to drive visual gestures overlays at 30fps edge speeds, passing frames recursively to a custom <strong className="text-purple-400 font-semibold">Node Express Server</strong> proxy backend. This proxy initializes Google GenAI client-side secrets safely away from browser breaches.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/60 border border-white/10 space-y-4">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest leading-none">Activating Live Multi-Modal Gemini SDK Translation</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              To trigger the continuous frame translator or play back natural audio speech files, the server reads the <code className="text-xs text-white font-mono bg-white/[0.04] px-1 py-0.5 rounded">GEMINI_API_KEY</code> from the environment.
            </p>
            
            <div className="p-4 bg-cyan-400/5 rounded-xl border border-cyan-400/10 space-y-2">
              <h4 className="text-xs font-bold text-cyan-300">How to configure your API Key:</h4>
              <ol className="text-[10px] text-gray-300 list-decimal pl-4 space-y-1">
                <li>Acquire an API Key from Google AI Studio.</li>
                <li>In this workspace, open the **Settings &gt; Secrets** panel.</li>
                <li>Add a secret named <code className="font-mono text-white">GEMINI_API_KEY</code> and set its value.</li>
                <li>The server will automatically bind the key on startup. No code compilation or modification needed!</li>
              </ol>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500 font-mono flex items-center justify-between">
            <span>Orchestration Version: 1.0.0 Stable</span>
            <span>Target Platform: Cloud Run Container Ingress</span>
          </div>

        </div>
      )}
    </div>
  );
}
