import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Copy, 
  Download, 
  Share2, 
  Sparkles, 
  AlertTriangle,
  Lightbulb,
  Pause
} from 'lucide-react';
import { translateImageApi, addHistoryItem, generateSpeechApi } from '../services/api';
import { UserSettings } from '../types';

interface ImageUploadProps {
  settings: UserSettings;
  addTranslationToState: (item: any) => void;
}

export default function ImageUpload({ settings, addTranslationToState }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [translating, setTranslating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Files drag-and-drop listeners
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
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // 2. Client-side file integrity validation
  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    setSuccessInfo(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported file format. Please upload JPG, JPEG or PNG files.");
      return;
    }

    // Validate size limit (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setErrorMsg("File size exceeds 50MB limit. Please compress or choose a smaller image.");
      return;
    }

    setImageFile(file);

    // Read to base64 preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 3. Trash image
  const resetUploadState = () => {
    setSelectedImage(null);
    setImageFile(null);
    setErrorMsg(null);
    setSuccessInfo(null);
    setIsPlayingAudio(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 4. Trigger Server-Side Gemini visual recognition pipeline
  const processImageTranslation = async () => {
    if (!selectedImage) return;

    setTranslating(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const mimeType = imageFile?.type || 'image/png';
      
      // Call standard server side parser
      const result = await translateImageApi(selectedImage, mimeType, settings.language);
      setSuccessInfo(result);

      // Auto-save translation to sqlite history logs
      if (settings.auto_save) {
        const queryText = settings.language === 'Hindi' ? result.translationHindi : result.translationEnglish;
        const savedItem = await addHistoryItem('image_upload', queryText, settings.language, result.confidence);
        if (savedItem) {
          addTranslationToState(savedItem);
        }
      }

      // Auto readout voice
      if (settings.auto_speech) {
        const textToSpeak = settings.language === 'Hindi' ? result.translationHindi : result.translationEnglish;
        readTextVoice(textToSpeak);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to parse sign language image. Please ensure your GEMINI_API_KEY is configured.");
    } finally {
      setTranslating(false);
    }
  };

  // 5. Synthesize and Speak voice files
  const readTextVoice = async (text: string) => {
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
        // browser synthesis fallback
        speakBrowserFallback(text);
      }
    } catch (e) {
      console.error(e);
      speakBrowserFallback(text);
    }
  };

  const speakBrowserFallback = (text: string) => {
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

  // 6. Sharing Utilities
  const copyOutputToClipboard = () => {
    if (!successInfo) return;
    const activeText = settings.language === 'Hindi' ? successInfo.translationHindi : successInfo.translationEnglish;
    navigator.clipboard.writeText(activeText);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const downloadTransMarkdown = () => {
    if (!successInfo) return;
    const dataMeta = `## SignBridge AI Gesture Recognition Details
- **Timestamp**: ${new Date().toLocaleString()}
- **Input Type**: Image Upload (.${imageFile?.name.split('.').pop()})
- **Recognized Gesture**: ${successInfo.gestureName}
- **Accuracy Confidence**: ${successInfo.confidence * 100}%
- **English Translation**: ${successInfo.translationEnglish}
- **Hindi Translation**: ${successInfo.translationHindi}
- **Coordinates Breakdown**: ${successInfo.description || 'Verified coordinates lines'}
`;
    const blob = new Blob([dataMeta], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated-sign-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareViaSoc = (platform: string) => {
    if (!successInfo) return;
    const messageText = settings.language === 'Hindi' ? successInfo.translationHindi : successInfo.translationEnglish;
    const bodyText = encodeURIComponent(`"${messageText}" - Multi-channel translation captured by SignBridge AI.`);

    const urls: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${bodyText}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${bodyText}`,
      email: `mailto:?subject=SignBridge%20Translation%20File&body=${bodyText}`,
      twitter: `https://twitter.com/intent/tweet?text=${bodyText}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
          Still Image sign Translation
        </h1>
        <p className="text-xs text-gray-400">Upload standalone JPG, JPEG, or PNG images containing hands to detect fingers spelling shapes and trigger audio synthesized narration.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Selector and Image Input Preview */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedImage ? (
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
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-[#141b2e] border border-white/5 flex items-center justify-center mb-4 text-cyan-400">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-gray-200">Drag and drop sign photo</h3>
                <p className="text-xs text-gray-400">Supported formats: JPG, JPEG, PNG. File size maximum limit: 50MB.</p>
                <div className="pt-3">
                  <span className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-extrabold text-[11px] text-slate-950 transition-colors pointer-events-none uppercase tracking-wider">
                    Browse Files
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden border border-white/5 bg-slate-900/40 relative shadow-2xl flex items-center justify-center min-h-[350px] p-6 max-h-[420px]">
              <img
                src={selectedImage}
                alt="Selected gesture source"
                className="max-h-[350px] max-w-full rounded-2xl object-contain shadow-lg"
              />
              
              {/* Image Control Utilities */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  type="button"
                  id="btn-trash-image"
                  onClick={resetUploadState}
                  className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-90 transition-all outline-none"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {!successInfo && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <button
                    onClick={processImageTranslation}
                    disabled={translating}
                    id="btn-translate-image"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 active:scale-95 text-xs text-white font-bold flex items-center space-x-2.5 border border-white/10 glow-cyan transition-all duration-150 shadow-lg outline-none cursor-pointer"
                  >
                    {translating ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                    )}
                    <span>{translating ? "Translating Sign with Gemini..." : "Start AI Sign Translation"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick guidance notes */}
          <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start space-x-3.5">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-200">Tips for Best Vision Results</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">Ensure high lighting contrast on the hands, keep fingers completely within the camera view bounds, and avoid noisy multi-colored backgrounds for maximum translation accuracy.</p>
            </div>
          </div>
        </div>

        {/* Right Card: Translation Details Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/5 h-full flex flex-col justify-between space-y-6">
            
            {successInfo ? (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-xs font-mono text-cyan-400 tracking-wider uppercase border-b border-white/5 pb-2">Translation Pipeline Output</h3>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase">Detected Handshape Pose</label>
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl font-bold text-white">
                    {successInfo.gestureName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-mono uppercase">Confidence Rate</label>
                    <div className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-xs text-cyan-400 font-bold">
                      {(successInfo.confidence * 100).toFixed(0)}% Match
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-mono uppercase">Target Translation</label>
                    <div className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-xs text-purple-400 font-bold">
                      {settings.language} Mode
                    </div>
                  </div>
                </div>

                {/* English/Hindi output */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">English Translated Text:</span>
                    <p className="text-sm font-bold text-white">{successInfo.translationEnglish}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-purple-500 font-mono uppercase">Hindi Translated Text:</span>
                    <p className="text-sm font-bold text-white font-sans">{successInfo.translationHindi}</p>
                  </div>
                </div>

                {/* Selected active speech result block  */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 font-mono uppercase">Synthesizer Text</span>
                  <div className="p-4 bg-slate-950/60 border border-cyan-500/10 rounded-2xl text-center">
                    <p className="text-base font-extrabold text-white leading-relaxed font-heading">
                      {settings.language === 'Hindi' ? successInfo.translationHindi : successInfo.translationEnglish}
                    </p>
                  </div>
                </div>

                {/* Synthesis sound modifiers controllers */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-mono uppercase">Acoustic Narrator</span>
                    <button
                      onClick={() => readTextVoice(settings.language === 'Hindi' ? successInfo.translationHindi : successInfo.translationEnglish)}
                      className="p-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 active:scale-95 transition-all outline-none"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Export Options */}
                  <div className="flex p-0.5 rounded-xl bg-slate-950 border border-white/5">
                    <button
                      onClick={copyOutputToClipboard}
                      className="flex-1 py-2 text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 outline-none border-r border-white/5"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>{copyFeedback || 'Copy Text'}</span>
                    </button>
                    <button
                      onClick={downloadTransMarkdown}
                      className="flex-1 py-2 text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 outline-none"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      <span>Download MD</span>
                    </button>
                  </div>

                  {/* Share platforms */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-400 font-mono uppercase">Share Accessibility Link</span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => shareViaSoc('whatsapp')}
                        className="py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/10 transition-all outline-none"
                      >
                        WA
                      </button>
                      <button
                        onClick={() => shareViaSoc('telegram')}
                        className="py-1.5 rounded-lg bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 text-[10px] font-bold border border-sky-500/10 transition-all outline-none"
                      >
                        TG
                      </button>
                      <button
                        onClick={() => shareViaSoc('twitter')}
                        className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-white/5 transition-all outline-none"
                      >
                        X
                      </button>
                      <button
                        onClick={() => shareViaSoc('email')}
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
                <ImageIcon className="w-12 h-12 text-gray-600 border border-dashed border-gray-700 p-2.5 rounded-full" />
                <div className="space-y-1 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-300">Analysis Not Inherent</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Upload a clear photo containing hand shapes on the left dashboard, then trigger "Start AI Sign Translation" to run the pipeline.</p>
                </div>
              </div>
            )}

            {/* Offline fallback banner label */}
            {successInfo && successInfo.isFallback && (
              <div className="p-3 bg-yellow-400/5 border border-yellow-500/20 rounded-xl text-[9px] text-yellow-300 leading-normal font-sans pt-1">
                <span className="font-bold uppercase tracking-wider block mb-1">Simulator Active</span>
                {successInfo.notice}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
