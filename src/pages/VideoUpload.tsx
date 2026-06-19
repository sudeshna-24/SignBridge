import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Video as VideoIcon, 
  Trash2, 
  Volume2, 
  Copy, 
  Download, 
  Sparkles, 
  AlertTriangle,
  Play,
  Pause,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { translateVideoApi, addHistoryItem, generateSpeechApi } from '../services/api';
import { UserSettings } from '../types';

interface VideoUploadProps {
  settings: UserSettings;
  addTranslationToState: (item: any) => void;
}

export default function VideoUpload({ settings, addTranslationToState }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [processing, setProcessing] = useState<boolean>(false);
  const [progressTracker, setProgressTracker] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [videoResults, setVideoResults] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessVideo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessVideo(e.target.files[0]);
    }
  };

  // Video validation
  const validateAndProcessVideo = (file: File) => {
    setErrorMsg(null);
    setVideoResults(null);
    setProgressTracker(0);

    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/mov'];
    const suffix = file.name.split('.').pop()?.toLowerCase();
    
    // Safety check with extensions as some mime types are empty
    const isValidExtension = ['mp4', 'mov', 'avi'].includes(suffix || '');
    if (!validVideoTypes.includes(file.type) && !isValidExtension) {
      setErrorMsg("Unsupported video format. Please upload MP4, MOV, or AVI files.");
      return;
    }

    // Maximum video size is 200MB
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Video size exceeds 200MB maximum. Please optimize or upload a shorter clip.");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearVideoState = () => {
    setVideoFile(null);
    if (videoUrl) {
       URL.revokeObjectURL(videoUrl);
       setVideoUrl(null);
    }
    setErrorMsg(null);
    setVideoResults(null);
    setProgressTracker(0);
    setIsPlayingAudio(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Video Frame Extracting Mechanics
  const processVideoTimeline = async () => {
    if (!videoUrl) return;
    setProcessing(true);
    setErrorMsg(null);
    setVideoResults(null);

    const video = hiddenVideoRef.current;
    if (!video) {
      setProcessing(false);
      setErrorMsg("Video parser initialization failed. Please reload the webpage.");
      return;
    }

    setProgressTracker(20);

    try {
      // Setup timeline slots (10%, 50%, 90% timestamps)
      const duration = video.duration || 5;
      const keyPoints = [duration * 0.1, duration * 0.5, duration * 0.9];
      const framesCollected: string[] = [];

      const captureFrameAtTime = (time: number): Promise<string> => {
        return new Promise((resolve) => {
          video.currentTime = time;
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              resolve('');
            }
          };
          video.addEventListener('seeked', onSeeked);
        });
      };

      // Extract each point frames
      for (let i = 0; i < keyPoints.length; i++) {
        setProgressTracker(25 + i * 20);
        const frameData = await captureFrameAtTime(keyPoints[i]);
        if (frameData) {
          framesCollected.push(frameData);
        }
      }

      setProgressTracker(80);

      // Call API
      const result = await translateVideoApi(framesCollected, settings.language);
      setVideoResults(result);

      setProgressTracker(100);

      // Save to server history database if authorized
      if (settings.auto_save) {
        const payloadText = settings.language === 'Hindi' ? result.sentenceHindi : result.sentenceEnglish;
        const saved = await addHistoryItem('video_upload', payloadText, settings.language, result.confidence);
        if (saved) {
          addTranslationToState(saved);
        }
      }

      // Read speech
      if (settings.auto_speech) {
        const textToRead = settings.language === 'Hindi' ? result.sentenceHindi : result.sentenceEnglish;
        speakVoiceResult(textToRead);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process video timeline. Please verify your GEMINI_API_KEY in Secrets.");
    } finally {
      setProcessing(false);
    }
  };

  // Synthesize and Speak
  const speakVoiceResult = async (text: string) => {
    if (!text) return;
    setIsPlayingAudio(true);

    try {
      const audioData = await generateSpeechApi(text, settings.language);
      if (audioData.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${audioData.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audio.play();
      } else {
        fallbackBrowserVoice(text);
      }
    } catch (e) {
      console.error(e);
      fallbackBrowserVoice(text);
    }
  };

  const fallbackBrowserVoice = (text: string) => {
    if (window.speechSynthesis) {
       window.speechSynthesis.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.lang = settings.language === 'Hindi' ? 'hi-IN' : 'en-US';
       utterance.onend = () => setIsPlayingAudio(false);
       utterance.onerror = () => setIsPlayingAudio(false);
       window.speechSynthesis.speak(utterance);
    } else {
       setIsPlayingAudio(false);
    }
  };

  const copyTextOutput = () => {
    if (!videoResults) return;
    const activeText = settings.language === 'Hindi' ? videoResults.sentenceHindi : videoResults.sentenceEnglish;
    navigator.clipboard.writeText(activeText);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const downloadReportTxt = () => {
    if (!videoResults) return;
    const token = `SignBridge AI - Video Timeline Translation Report\nTimestamp: ${new Date().toLocaleString()}\nFile: ${videoFile?.name}\nResult Sentence: "${settings.language === 'Hindi' ? videoResults.sentenceHindi : videoResults.sentenceEnglish}"\n\nTimeline Milestones:\n` + 
      videoResults.timeline.map((t: any) => `- [${t.timeline}]: Gesture: ${t.gesture} -> En: ${t.en} / Hi: ${t.hi}`).join('\n');

    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-translate-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareSocialChannels = (platform: string) => {
    if (!videoResults) return;
    const bodyStr = encodeURIComponent(`Video Sign Language Translated Sentence: "${settings.language === 'Hindi' ? videoResults.sentenceHindi : videoResults.sentenceEnglish}" using SignBridge AI accessibility helper.`);
    
    const links: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${bodyStr}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${bodyStr}`,
      email: `mailto:?subject=SignBridge%20Video%20Vocal&body=${bodyStr}`,
      twitter: `https://twitter.com/intent/tweet?text=${bodyStr}`
    };

    if (links[platform]) {
      window.open(links[platform], '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
          Continuous video Translation
        </h1>
        <p className="text-xs text-gray-400">Process recorded sign-language MP4, MOV, or AVI clips frame-by-frame. The system extracts timelines and builds full coherent combined sentences.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Video selection and playbacks */}
        <div className="lg:col-span-2 space-y-4">
          
          {!videoUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-3xl min-h-[350px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-cyan-400 bg-cyan-400/5 glow-cyan' 
                  : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.avi"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-[#141b2e] border border-white/5 flex items-center justify-center mb-4 text-purple-400">
                <VideoIcon className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-gray-200">Drag and drop sign video file</h3>
                <p className="text-xs text-gray-400">Supported formats: MP4, MOV, AVI. Maximum file size: 200MB.</p>
                <div className="pt-3">
                  <span className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 font-extrabold text-[11px] text-white transition-colors pointer-events-none uppercase tracking-wider">
                    Browse Videos
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden border border-white/5 bg-slate-900/40 relative shadow-2xl p-6 flex flex-col justify-between">
              
              {/* Internal hidden element for frame slicing extraction canvas */}
              <video
                ref={hiddenVideoRef}
                src={videoUrl}
                preload="metadata"
                className="hidden"
                muted
                crossOrigin="anonymous"
              />

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/60 border border-white/5 relative">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video control utility row */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white truncate max-w-xs">{videoFile?.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">Size: {((videoFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={clearVideoState}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-90 transition-all outline-none cursor-pointer"
                    title="Remove Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {!videoResults && (
                    <button
                      onClick={processVideoTimeline}
                      disabled={processing}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 active:scale-95 text-xs text-white border border-white/10 font-bold flex items-center space-x-2 shadow-lg transition-all outline-none cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                      <span>{processing ? `Slicing Frames (${progressTracker}%)` : "Analyze Video Timeline"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Slider */}
              {processing && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Frame Skipped Sequencer Matrix</span>
                    <span>{progressTracker}% Loaded</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden relative border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      style={{ width: `${progressTracker}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Info Sidebar Panel - Sentence timeline */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-full space-y-6">
            
            {videoResults ? (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-xs font-mono text-cyan-400 tracking-wider uppercase border-b border-white/5 pb-2">Video Sign Analysis Timeline</h3>
                
                {/* Timeline display cards */}
                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                  {videoResults.timeline && videoResults.timeline.map((stamp: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">{settings.language === 'Hindi' ? stamp.hi : stamp.en}</p>
                          <p className="text-[9px] text-gray-500 font-mono tracking-widest">{stamp.gesture}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        {stamp.timeline}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Built final sentence box */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] text-gray-400 font-mono uppercase">Composed Final Sentence Output</label>
                  <div className="p-4 bg-slate-950/60 border border-cyan-500/10 rounded-2xl text-center">
                    <p className="text-sm font-extrabold text-white leading-relaxed font-heading">
                      {settings.language === 'Hindi' ? videoResults.sentenceHindi : videoResults.sentenceEnglish}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-mono uppercase">Timeline Accuracy</label>
                    <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-xs text-cyan-400 font-bold">
                      {(videoResults.confidence * 100).toFixed(0)}% Stable
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-mono uppercase">Vocal Voice Preset</label>
                    <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-xs text-purple-400 font-bold">
                      {settings.language} Speak
                    </div>
                  </div>
                </div>

                {/* Synthesizer narration trigger */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-mono uppercase">Vocal Audio Reader</span>
                    <button
                      onClick={() => speakVoiceResult(settings.language === 'Hindi' ? videoResults.sentenceHindi : videoResults.sentenceEnglish)}
                      className="p-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 active:scale-95 transition-all outline-none"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Export Options */}
                  <div className="flex p-0.5 rounded-xl bg-slate-950 border border-white/5">
                    <button
                      onClick={copyTextOutput}
                      className="flex-1 py-2 text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 outline-none border-r border-white/5"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>{copyFeedback || 'Copy Text'}</span>
                    </button>
                    <button
                      onClick={downloadReportTxt}
                      className="flex-1 py-2 text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 outline-none"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      <span>Download TXT</span>
                    </button>
                  </div>

                  {/* Shares */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-400 font-mono uppercase">Share Accessibility Link</span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => shareSocialChannels('whatsapp')}
                        className="py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/10 transition-all outline-none"
                      >
                        WA
                      </button>
                      <button
                        onClick={() => shareSocialChannels('telegram')}
                        className="py-1.5 rounded-lg bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 text-[10px] font-bold border border-sky-500/10 transition-all outline-none"
                      >
                        TG
                      </button>
                      <button
                        onClick={() => shareSocialChannels('twitter')}
                        className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-white/5 transition-all outline-none"
                      >
                        X
                      </button>
                      <button
                        onClick={() => shareSocialChannels('email')}
                        className="py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-[10px] font-bold border border-purple-500/10 transition-all outline-none"
                      >
                        Mail
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                <VideoIcon className="w-12 h-12 text-gray-600 border border-dashed border-gray-700 p-2.5 rounded-full" />
                <div className="space-y-1 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-300">Timeline Parser Inactive</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Choose an MP4 sign language file on the left canvas container and trigger "Analyze Video Timeline" to start frame slicing and parsing.</p>
                </div>
              </div>
            )}

            {/* Offline Fallback Banner Alert */}
            {videoResults && videoResults.isFallback && (
              <div className="p-3 bg-yellow-400/5 border border-yellow-500/20 rounded-xl text-[9px] text-yellow-300 leading-normal font-sans">
                <span className="font-bold uppercase tracking-wider block mb-0.5">Simulator Active</span>
                Connect your GEMINI_API_KEY inside the secrets drawer toggles to unlock state-of-the-art continuous video parsing with Gemini 3.5.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
