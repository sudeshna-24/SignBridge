import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Volume2, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  Camera, 
  Image as ImageIcon, 
  Video,
  Info,
  ChevronRight,
  Filter,
  VolumeX,
  Pause
} from 'lucide-react';
import { clearAllHistory, removeHistoryItem, generateSpeechApi } from '../services/api';
import { TranslationItem } from '../types';

interface HistoryModuleProps {
  historyList: TranslationItem[];
  setHistoryList: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
}

export default function HistoryModule({ historyList, setHistoryList }: HistoryModuleProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'All' | 'live_camera' | 'image_upload' | 'video_upload'>('All');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 1. Search & Filter logic
  const filteredList = historyList.filter((item) => {
    const matchesSearch = item.extracted_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || item.input_type === selectedType;
    return matchesSearch && matchesType;
  });

  // 2. Play Synthesizer Voice for History Item
  const playVoice = async (item: TranslationItem) => {
    if (playingId === item.id) {
       setPlayingId(null);
       return;
    }
    setPlayingId(item.id);
    
    try {
      const audioData = await generateSpeechApi(item.extracted_text, item.language);
      if (audioData.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${audioData.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play();
      } else {
        fallbackVocalRead(item);
      }
    } catch (e) {
      console.error(e);
      fallbackVocalRead(item);
    }
  };

  const fallbackVocalRead = (item: TranslationItem) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(item.extracted_text);
      ut.lang = item.language === 'Hindi' ? 'hi-IN' : 'en-US';
      ut.onend = () => setPlayingId(null);
      ut.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(ut);
    } else {
      setPlayingId(null);
    }
  };

  // 3. Delete Singular History Block
  const deleteItem = async (id: string) => {
    const success = await removeHistoryItem(id);
    if (success) {
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 4. Erase entire History log
  const clearHistoryLog = async () => {
    if (window.confirm("Are you sure you want to permanently delete all translation history items from the database?")) {
      const success = await clearAllHistory();
      if (success) {
        setHistoryList([]);
      }
    }
  };

  // 5. Generate and Download Database CSV document
  const exportToCSV = () => {
    if (filteredList.length === 0) return;

    // columns headers
    const headers = ['ID', 'Type', 'Extracted Translation Text', 'Language Output', 'Confidence Accordance', 'Created Timestamp'];
    const rows = filteredList.map(item => [
      item.id,
      item.input_type,
      `"${item.extracted_text.replace(/"/g, '""')}"`,
      item.language,
      `${(item.confidence * 100).toFixed(0)}%`,
      item.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-translations-database-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper: input typ icon selectors
  const renderInputTypeIcon = (type: string) => {
    switch (type) {
      case 'live_camera':
        return <Camera className="w-3.5 h-3.5 text-cyan-400" />;
      case 'image_upload':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'video_upload':
        return <Video className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <History className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const formatLabelType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Translation database History Logs
          </h1>
          <p className="text-xs text-gray-400">Search, filter, replay, or download previous translation results synced with your localized persistent SQLite storage schemas.</p>
        </div>

        {/* Clear and export database buttons */}
        {historyList.length > 0 && (
          <div className="flex space-x-2 shrink-0">
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center space-x-2 border border-cyan-500/10 transition-all outline-none cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={clearHistoryLog}
              id="btn-clear-history"
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center space-x-2 border border-red-500/10 transition-all outline-none cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Database</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search HUD Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
        
        {/* Search Field */}
        <div className="md:col-span-2 relative flex items-center">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search historic translations text or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 hover:border-white/10 focus:border-cyan-400 focus:bg-slate-950 outline-none transition-all"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex p-0.5 bg-slate-950 rounded-xl border border-white/5 space-x-0.5">
          {([
            { id: 'All', label: 'All' },
            { id: 'live_camera', label: 'Live' },
            { id: 'image_upload', label: 'Image' },
            { id: 'video_upload', label: 'Video' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all outline-none ${
                selectedType === tab.id 
                  ? 'bg-[#141b2e] text-cyan-400 border border-white/5' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Historic translation list list mapping */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              id={`history-row-${item.id}`}
              className="p-5 rounded-2xl bg-[#141B2D]/80 hover:bg-[#141B2D] border border-white/5 hover:border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
            >
              {/* Left Column: Icon + Stamp + Texts */}
              <div className="flex items-start space-x-4">
                {/* Visual Icon Badge */}
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center shrink-0">
                  {renderInputTypeIcon(item.input_type)}
                </div>

                <div className="space-y-1">
                  {/* Category identifiers row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wide">
                      {formatLabelType(item.input_type)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-[9px] font-semibold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 font-mono">
                      {item.language} Output
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-[9px] font-mono text-cyan-400">
                      {(item.confidence * 100).toFixed(0)}% Accuracy
                    </span>
                  </div>

                  {/* Extracted text */}
                  <p className="text-sm font-bold text-white tracking-tight leading-normal pt-1 pr-4 font-sans">
                    "{item.extracted_text}"
                  </p>

                  {/* Calendar logs time */}
                  <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-mono leading-none pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Audio narration playback controls and individual deletes */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => playVoice(item)}
                  className="p-2.5 rounded-xl bg-cyan-400/5 hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 border border-cyan-500/5 hover:border-cyan-500/10 outline-none transition-all duration-150 cursor-pointer"
                  title="Replay Voice Speech"
                >
                  {playingId === item.id ? <Pause className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 border border-red-500/5 hover:border-red-500/15 outline-none transition-all duration-150 cursor-pointer"
                  title="Remove Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900/10 border border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-4">
          <History className="w-12 h-12 text-gray-600 border border-dashed border-gray-700 p-2.5 rounded-full" />
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-gray-300">Translations Log Is Empty</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">No translation records match your filters. Run a webcam recognition, translate image snapshots, or upload videos to populate this database.</p>
          </div>
        </div>
      )}
    </div>
  );
}
