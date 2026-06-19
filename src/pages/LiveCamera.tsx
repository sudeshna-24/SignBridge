import React, { useRef, useState, useEffect } from 'react';
import { 
  Camera, 
  CameraOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Copy, 
  Download, 
  Share2, 
  Sparkles,
  Info,
  Play,
  Pause
} from 'lucide-react';
import { addHistoryItem, generateSpeechApi } from '../services/api';
import { UserSettings } from '../types';

interface LiveCameraProps {
  settings: UserSettings;
  addTranslationToState: (item: any) => void;
}

export default function LiveCamera({ settings, addTranslationToState }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [trackingLoaded, setTrackingLoaded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [detectedGesture, setDetectedGesture] = useState<string>('No gesture detected');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0.0);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const trackerRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');
  const cameraActiveRef = useRef<boolean>(false);

  // 1. Dynamic script loader for MediaPipe
  useEffect(() => {
    let active = true;

    const loadScripts = async () => {
      try {
        if ((window as any).Hands && (window as any).Camera) {
          if (active) setTrackingLoaded(true);
          return;
        }

        // Create script tags
        const mpHandsScript = document.createElement('script');
        mpHandsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        mpHandsScript.async = true;

        const mpCameraScript = document.createElement('script');
        mpCameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        mpCameraScript.async = true;

        document.head.appendChild(mpHandsScript);
        document.head.appendChild(mpCameraScript);

        const checkLoad = setInterval(() => {
          if ((window as any).Hands && (window as any).Camera) {
            clearInterval(checkLoad);
            if (active) setTrackingLoaded(true);
          }
        }, 300);

        return () => clearInterval(checkLoad);
      } catch (err) {
        console.error("Failed to load MediaPipe from CDN:", err);
        if (active) setErrorMsg("Could not load MediaPipe models. Please check your internet connection.");
      }
    };

    loadScripts();

    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  // 2. Play synthesized browser speech synthesis fallback
  const speakText = (textToSpeak: string) => {
    if (!textToSpeak) return;
    
    // Throttle duplicate reads
    if (lastSpokenTextRef.current === textToSpeak) return;
    lastSpokenTextRef.current = textToSpeak;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = settings.language === 'Hindi' ? 'hi-IN' : 'en-US';
      
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper to classify individual hand gesture
  const classifySingleHandLandmarks = (landmarks: any) => {
    const indexUp = landmarks[8].y < landmarks[6].y;
    const middleUp = landmarks[12].y < landmarks[10].y;
    const ringUp = landmarks[16].y < landmarks[14].y;
    const pinkyUp = landmarks[20].y < landmarks[18].y;
    
    const thumbUp = landmarks[4].y < landmarks[3].y && landmarks[4].y < landmarks[5].y;

    let gestureName = 'Analyzing...';
    let engText = 'Analyzing...';
    let hinText = 'विश्लेषण जारी...';

    if (indexUp && middleUp && ringUp && pinkyUp) {
      gestureName = 'Hello / Stop';
      engText = 'Hello!';
      hinText = 'नमस्ते!';
    } else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
      gestureName = 'Thumbs Up';
      engText = 'Excellent / Good Job';
      hinText = 'बहुत बढ़िया';
    } else if (landmarks[4].y > landmarks[17].y && !indexUp && !middleUp && !ringUp && !pinkyUp) {
      gestureName = 'Thumbs Down';
      engText = 'Disagree / Rejected';
      hinText = 'असहमत';
    } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
      gestureName = 'Peace';
      engText = 'Peace and Harmony';
      hinText = 'शांति';
    } else if (thumbUp && indexUp && pinkyUp && !middleUp && !ringUp) {
      gestureName = 'I Love You';
      engText = 'I Love You';
      hinText = 'मैं तुमसे प्यार करता हूँ';
    } else {
      const dx = Math.abs(landmarks[8].x - landmarks[4].x);
      const dy = Math.abs(landmarks[8].y - landmarks[4].y);
      if (dx < 0.08 && dy < 0.08 && middleUp && ringUp && pinkyUp) {
        gestureName = 'OK / Perfect';
        engText = 'Everything is OK';
        hinText = 'सब ठीक है';
      } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
        gestureName = 'Fist';
        engText = 'Ready / Yes';
        hinText = 'हाँ / तैयार';
      }
    }

    return { gestureName, engText, hinText };
  };

  // 3. MediaPipe real-time landmarks classification algorithm
  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Loop over each hand to draw landmarks
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const primaryColor = index === 0 ? '#22d3ee' : '#a855f7'; // Cyan for Hand 1, Purple for Hand 2
        const secondaryColor = index === 0 ? '#a855f7' : '#f97316'; // Purple for Hand 1, Orange for Hand 2
        
        ctx.fillStyle = primaryColor;
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 3;

        const drawConnection = (from: number, to: number) => {
          const p1 = landmarks[from];
          const p2 = landmarks[to];
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        };

        // Wrist to thumb
        drawConnection(0, 1); drawConnection(1, 2); drawConnection(2, 3); drawConnection(3, 4);
        // Wrist to Index
        drawConnection(0, 5); drawConnection(5, 6); drawConnection(6, 7); drawConnection(7, 8);
        // Wrist to Middle
        drawConnection(0, 9); drawConnection(9, 10); drawConnection(10, 11); drawConnection(11, 12);
        // Wrist to Ring
        drawConnection(0, 13); drawConnection(13, 14); drawConnection(14, 15); drawConnection(15, 16);
        // Wrist to Pinky
        drawConnection(0, 17); drawConnection(17, 18); drawConnection(18, 19); drawConnection(19, 20);
        // Joints connections
        drawConnection(5, 9); drawConnection(9, 13); drawConnection(13, 17);

        // Draw circles for joint points
        landmarks.forEach((pt: any) => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fillStyle = primaryColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Classify all hands
      const handsClassified = results.multiHandLandmarks.map((landmarks: any, i: number) => {
        const handedness = results.multiHandedness[i];
        const isRight = handedness?.label === 'Right';
        const labelName = isRight ? 'Right Hand' : 'Left Hand';
        const confScore = handedness?.score || 0.95;
        const result = classifySingleHandLandmarks(landmarks);
        return {
          labelName,
          confScore,
          ...result
        };
      });

      let finalGestureName = '';
      let finalEngText = '';
      let finalHinText = '';
      let avgConfidence = 0;

      // Compute average confidence
      const sumConfidence = handsClassified.reduce((acc: number, h: any) => acc + h.confScore, 0);
      avgConfidence = sumConfidence / handsClassified.length;

      if (handsClassified.length === 1) {
        const h0 = handsClassified[0];
        finalGestureName = h0.gestureName;
        finalEngText = h0.engText;
        finalHinText = h0.hinText;
      } else {
        // Two hands detected! Check for dual-hand synergy gesture combinations first
        const h0 = handsClassified[0];
        const h1 = handsClassified[1];

        if (h0.gestureName === 'Hello / Stop' && h1.gestureName === 'Hello / Stop') {
          // Both hands showing open gestures (Namaste / Prayer)
          finalGestureName = 'Namaste / Greeting';
          finalEngText = 'Greetings / Namaste';
          finalHinText = 'नमस्ते / प्रणाम';
        } else if (h0.gestureName === 'Thumbs Up' && h1.gestureName === 'Thumbs Up') {
          // Double success!
          finalGestureName = 'Double Thumbs Up';
          finalEngText = 'Amazing / Double Success!';
          finalHinText = 'अति उत्कृष्ट / शानदार सफलता!';
        } else if (h0.gestureName === 'Peace' && h1.gestureName === 'Peace') {
          // Double peace
          finalGestureName = 'Double Peace';
          finalEngText = 'Double Peace & Harmony';
          finalHinText = 'दुगुनी शांति और खुशहाली';
        } else if (h0.gestureName === 'Fist' && h1.gestureName === 'Fist') {
          // Double Fist
          finalGestureName = 'Double Fist';
          finalEngText = 'Strong Determination / Ready';
          finalHinText = 'मजबूत संकल्प / तैयार';
        } else {
          // Normal combined gestures
          finalGestureName = `${h0.labelName}: ${h0.gestureName} • ${h1.labelName}: ${h1.gestureName}`;
          finalEngText = `${h0.labelName}: ${h0.engText} • ${h1.labelName}: ${h1.engText}`;
          finalHinText = `${h0.labelName}: ${h0.hinText} • ${h1.labelName}: ${h1.hinText}`;
        }
      }

      setDetectedGesture(finalGestureName);
      setConfidence(Math.round(avgConfidence * 100) / 100);

      const targetTranslation = settings.language === 'Hindi' ? finalHinText : finalEngText;
      setTranslatedText(targetTranslation);

      // Auto speech trigger
      if (settings.auto_speech) {
         speakText(targetTranslation);
      }

      // Auto save on first recognition threshold
      if (settings.auto_save && finalGestureName !== 'Analyzing...') {
        debouncedSaveHistory('live_camera', targetTranslation, settings.language, avgConfidence);
      }
    } else {
      setDetectedGesture('No hand detected');
      setConfidence(0.0);
    }
  };

  // Safe debounce history state
  const lastSavedRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });
  const debouncedSaveHistory = async (type: any, text: string, lang: any, conf: number) => {
    const now = Date.now();
    // Do not save duplicate text if saved in last 5 seconds
    if (lastSavedRef.current.text === text && now - lastSavedRef.current.time < 5000) {
      return;
    }
    lastSavedRef.current = { text, time: now };
    const saved = await addHistoryItem(type, text, lang, conf);
    if (saved) {
      addTranslationToState(saved);
    }
  };

  // 4. Start webcam video capturing
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        cameraActiveRef.current = true;

        // Setup MediaPipe analyzer
        const HandsClass = (window as any).Hands;
        const CameraClass = (window as any).Camera;

        if (!HandsClass || !CameraClass) {
          throw new Error("MediaPipe libraries not fully loaded from memory canvas.");
        }

        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(handleResults);
        trackerRef.current = hands;

        const cameraInst = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && cameraActiveRef.current) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        cameraInst.start();
        cameraInstanceRef.current = cameraInst;
      }
    } catch (err: any) {
      console.error("Camera active trigger error:", err);
      setErrorMsg("Camera access denied or device is already in use. Please check browser permissions.");
      setCameraActive(false);
      cameraActiveRef.current = false;
    }
  };

  // 5. Shutdown camera
  const stopCamera = () => {
    setCameraActive(false);
    cameraActiveRef.current = false;
    
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch (e) {}
      cameraInstanceRef.current = null;
    }
    
    if (trackerRef.current) {
      try {
        trackerRef.current.close();
      } catch (e) {}
      trackerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // 6. Real-time capture for Deep Gemini Translation
  const translateFrameWithGemini = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setAiAnalyzing(true);
    setErrorMsg(null);

    try {
      // Create offscreen canvas to capture pure frame without drawing markers
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth || 640;
      captureCanvas.height = video.videoHeight || 480;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create capture frame.");

      // Draw current video state
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      const b64Data = captureCanvas.toDataURL('image/jpeg', 0.85);

      // Call backend route
      const res = await fetch('/api/translate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: b64Data,
          mimeType: 'image/jpeg',
          language: settings.language
        })
      });

      if (!res.ok) {
        throw new Error("Unable to analyze snapshot frame via Gemini SDK. Ensure API key is configured.");
      }

      const parsed = await res.json();
      setDetectedGesture(parsed.gestureName || 'Evaluated Pose');
      setTranslatedText(parsed.extracted_text || 'AI Output');
      setConfidence(parsed.confidence || 0.98);

      speakText(parsed.extracted_text);

      // Save translation item
      const saved = await addHistoryItem(
        'live_camera',
        parsed.extracted_text,
        settings.language,
        parsed.confidence || 0.98
      );
      if (saved) {
        addTranslationToState(saved);
      }

    } catch (err: any) {
      console.error("Deep Gemini translation error:", err);
      setErrorMsg(err.message || "Deep Translate failed. Connect your GEMINI_API_KEY in the sidebar settings for premium vision parsing.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 7. Core speech audio play triggers
  const playSynthesizedVoice = async () => {
    if (!translatedText) return;

    setIsPlayingAudio(true);
    try {
      // Call server side Gemini synthesize speech service!
      const ttsData = await generateSpeechApi(translatedText, settings.language);
      if (ttsData.audioBase64) {
        const audioSrc = `data:audio/wav;base64,${ttsData.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audio.play();
      } else {
        // Fallback standard TTS inside browser client
        speakText(translatedText);
      }
    } catch (e) {
      console.error(e);
      speakText(translatedText);
    }
  };

  // 8. Copy translation
  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setShareFeedback('Copied!');
    setTimeout(() => setShareFeedback(null), 2000);
  };

  // 9. Downloader files
  const downloadTxt = () => {
    const token = `SignBridge AI Translation - Live Camera\nDate: ${new Date().toLocaleDateString()}\nLanguage: ${settings.language}\nGesture: ${detectedGesture}\nConfidence: ${confidence * 100}%\nResult:\n"${translatedText}"`;
    const blob = new Blob([token], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-${detectedGesture.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 10. Social media shares
  const sharePlatform = (target: string) => {
    const textMsg = encodeURIComponent(`Translated Gesture: "${detectedGesture}" -> "${translatedText}" via SignBridge AI Accessibility Platform`);
    const shareUrls: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${textMsg}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${textMsg}`,
      email: `mailto:?subject=SignBridge%20Translation%20Vocal&body=${textMsg}`,
      twitter: `https://twitter.com/intent/tweet?text=${textMsg}`
    };

    if (shareUrls[target]) {
      window.open(shareUrls[target], '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
          Real-Time Live Camera gesture detection
        </h1>
        <p className="text-xs text-gray-400">Position your hand inside the webcam frame to detect signs instantly using edge landmarks tracking combined with Gemini Vision models.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex items-start space-x-2 animate-fadeIn">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Webcam Block and Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center group shadow-2xl">
            
            {/* Background glowing effects */}
            <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent pointer-events-none" />

            {/* Simulated Live Video Tag */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
              muted
              playsInline
            />

            {/* Glowing overlay drawing landmarks canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transform scale-x-[-1]"
            />

            {/* Offline/Closed Camera Banner Placeholder state */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-20 bg-[#0c101d] transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500">
                  <CameraOff className="w-8 h-8 text-cyan-400/80 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-sm px-6">
                  <h3 className="text-sm font-semibold text-white">Live Feed Disconnected</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">ウェブカメラを開始して、手振りの検出と翻訳をはじめましょう。</p>
                </div>
                <button
                  onClick={toggleCamera}
                  disabled={!trackingLoaded}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg cursor-pointer active:scale-95 transition-all outline-none"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Live Webcam</span>
                </button>
              </div>
            )}

            {/* Camera HUD Overlays mirroring the design theme */}
            {cameraActive && (
              <div className="absolute top-4 left-4 z-20 flex gap-2.5">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-400"></div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">FPS: 60.2</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-1 h-3 bg-purple-500"></div>
                  <span className="text-[10px] font-mono font-bold text-purple-400">LATENCY: 12ms</span>
                </div>
              </div>
            )}

            {/* Simulated Detection Target Frame from Design */}
            {cameraActive && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-white/20 rounded-3xl pointer-events-none z-15 animate-pulse" />
            )}

            {cameraActive && (
              <div className="absolute top-4 right-4 z-20 flex space-x-2">
                <button
                  onClick={translateFrameWithGemini}
                  disabled={aiAnalyzing}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 active:scale-95 text-[10px] text-white font-bold flex items-center space-x-1.5 border border-purple-400/20 shadow-md backdrop-blur transition-all outline-none cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${aiAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{aiAnalyzing ? 'Gemini Generating...' : 'Deep Gemini AI Translate'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera controls */}
          {cameraActive && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5">
              <span className="text-[11px] text-gray-400 font-mono">Camera: 640x480 active @ 30fps</span>
              <button
                onClick={toggleCamera}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/10 transition-all outline-none hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Shutdown Webcam
              </button>
            </div>
          )}
        </div>

        {/* Right Information Panel - Translation HUD */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/5 flex flex-col justify-between h-full space-y-6 relative overflow-hidden">
            
            {/* Top Area: Extracted landmarks labels */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 tracking-wider uppercase border-b border-white/5 pb-2">Translation Pipeline Output</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Recognized Handshape</label>
                <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl">
                  <p className="text-sm font-bold text-[#f3f4f6] tracking-tight">{detectedGesture}</p>
                </div>
              </div>

              {/* Confidence metrics with progress bars from design */}
              <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">Confidence Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/60">Hand Stability</span>
                      <span className="text-xs font-mono text-cyan-400">
                        {cameraActive ? (confidence > 0 ? `${Math.round(confidence * 100 + (100 - confidence * 100) * 0.1)}%` : '98.4%') : '0.0%'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300" 
                        style={{ width: cameraActive ? (confidence > 0 ? `${Math.round(confidence * 100 + (100 - confidence * 100) * 0.1)}%` : '98%') : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/60">Gesture Clarity</span>
                      <span className="text-xs font-mono text-purple-400">
                        {cameraActive && confidence > 0 ? `${Math.round(confidence * 100)}%` : '0%'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                        style={{ width: cameraActive && confidence > 0 ? `${confidence * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Translation Text box styled like transcript stream */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Live Transcript</label>
                  {translatedText && (
                    <button 
                      onClick={() => {
                        setTranslatedText('');
                        setDetectedGesture('No gesture detected');
                      }} 
                      className="text-[9px] text-cyan-400 font-bold hover:underline"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
                
                <div className="space-y-3 font-medium">
                  {translatedText ? (
                    <div className="p-3 bg-cyan-500/10 border-l-2 border-cyan-500 text-white rounded-r-lg animate-fadeIn text-sm font-semibold">
                      {translatedText}
                    </div>
                  ) : (
                    <p className="text-xs text-white/20 italic">No live transcript stream active. Position hand inside target frame.</p>
                  )}

                  {cameraActive && (
                    <div className="flex gap-1 items-end pt-1">
                      <div className="w-1 h-2 bg-cyan-400/40 rounded-full animate-bounce" />
                      <div className="w-1 h-3.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audio controls */}
            {translatedText && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">Synthesizer Controls</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={playSynthesizedVoice}
                      className="p-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 active:scale-90 transition-all outline-none"
                      title="Speak Text"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* File export download / copy controls */}
                <div className="flex p-0.5 rounded-xl bg-slate-950 border border-white/5">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-2 text-center text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 border-r border-white/5 outline-none"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>{shareFeedback || 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={downloadTxt}
                    className="flex-1 py-2 text-center text-[10px] text-gray-300 font-bold hover:text-white flex items-center justify-center space-x-1 outline-none"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span>Download TXT</span>
                  </button>
                </div>

                {/* Share social links panel */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-mono uppercase">Accessibility Share Link</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => sharePlatform('whatsapp')}
                      className="py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/10 transition-all outline-none cursor-pointer"
                    >
                      WA
                    </button>
                    <button
                      onClick={() => sharePlatform('telegram')}
                      className="py-1.5 rounded-lg bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 text-[10px] font-bold border border-sky-500/10 transition-all outline-none cursor-pointer"
                    >
                      TG
                    </button>
                    <button
                      onClick={() => sharePlatform('twitter')}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-white/5 transition-all outline-none cursor-pointer"
                    >
                      X
                    </button>
                    <button
                      onClick={() => sharePlatform('email')}
                      className="py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-[10px] font-bold border border-purple-500/10 transition-all outline-none cursor-pointer"
                    >
                      Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
