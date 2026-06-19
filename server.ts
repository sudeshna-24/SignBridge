import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store history and settings in a file-based storage mimicking SQLite transitions
const DB_DIR = path.join(process.cwd(), 'database');
const HISTORY_FILE = path.join(DB_DIR, 'translations.json');
const SETTINGS_FILE = path.join(DB_DIR, 'settings.json');

// Ensure db directory structure exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// In-Memory Fallback structure
const initDb = () => {
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      language: 'English',
      auto_speech: true,
      auto_save: true,
      theme: 'Dark',
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
};

initDb();

// Load history helpers
const getHistory = () => {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const saveHistoryList = (list: any[]) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2));
};

const getSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch (e) {
    return {
      language: 'English',
      auto_speech: true,
      auto_save: true,
      theme: 'Dark',
    };
  }
};

const saveSettingsObj = (settings: any) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

// Safe Gemini client initialization
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient central helper that retries of different models in case of high-demand errors (503/429)
const generateContentWithFallback = async (ai: any, params: any) => {
  const primaryModel = params.model;
  const modelsToTry = [primaryModel];

  // If the model is a standard text helper, we have fallback models ready
  if (primaryModel === 'gemini-3.5-flash') {
    modelsToTry.push('gemini-flash-latest');
    modelsToTry.push('gemini-3.1-pro-preview');
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Requesting generative content with model name: ${model}`);
      const response = await ai.models.generateContent({
        ...params,
        model
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Model ${model} failed, error details:`, err.message || err);
    }
  }
  throw lastError;
};

// --- API ENDPOINTS ---

// 1. Database History Endpoints
app.get('/api/history', (req, res) => {
  const list = getHistory();
  res.json(list);
});

app.post('/api/history', (req, res) => {
  const { input_type, extracted_text, language, confidence } = req.body;
  if (!extracted_text) {
    return res.status(400).json({ error: 'Extracted text is required' });
  }

  const list = getHistory();
  const newItem = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    input_type: input_type || 'image_upload',
    extracted_text,
    language: language || 'English',
    confidence: confidence !== undefined ? parseFloat(confidence) : 1.0,
    created_at: new Date().toISOString(),
  };

  list.unshift(newItem);
  saveHistoryList(list);
  res.json(newItem);
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const list = getHistory();
  const filtered = list.filter((item: any) => item.id !== id);
  saveHistoryList(filtered);
  res.json({ success: true, id });
});

app.delete('/api/history', (req, res) => {
  // Clear all
  saveHistoryList([]);
  res.json({ success: true, message: 'All histories cleared' });
});

// 2. Settings Endpoints
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  const current = getSettings();
  const updated = { ...current, ...req.body };
  saveSettingsObj(updated);
  res.json(updated);
});

// 3. AI Translation Endpoint - Uploaded Images (PNG, JPG, JPEG)
app.post('/api/translate/image', async (req, res) => {
  try {
    const { imageBase64, mimeType, language } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Offline fallback processing if API key is not yet set
      const fallbackGestures = [
        { name: 'Thumbs Up', txtEn: 'Excellent', txtHi: 'उत्कृष्ट/बहुत बढ़िया', desc: 'Positive feedback gesture' },
        { name: 'I Love You', txtEn: 'I love you', txtHi: 'मैं तुमसे प्यार करता हूँ', desc: 'Hand displaying thumb, index and pinky fingers' },
        { name: 'Peace', txtEn: 'Peace / Victory', txtHi: 'शांति / विजय', desc: 'Index and middle fingers shape V' },
        { name: 'OK', txtEn: 'Everything is fine', txtHi: 'सब ठीक है', desc: 'O-ring thumb and index shape' },
        { name: 'Hello', txtEn: 'Hello, welcome!', txtHi: 'नमस्ते, स्वागत है!', desc: 'Full open palm wave representation' }
      ];
      // pick a random gesture or parse based on payload lengths
      const selectIndex = imageBase64.length % fallbackGestures.length;
      const chosen = fallbackGestures[selectIndex];
      const selectedText = language === 'Hindi' ? chosen.txtHi : chosen.txtEn;

      return res.json({
        gestureName: chosen.name,
        translationEnglish: chosen.txtEn,
        translationHindi: chosen.txtHi,
        extracted_text: selectedText,
        confidence: 0.95,
        description: chosen.desc,
        isFallback: true,
        notice: 'Note: Running in offline fallback simulator because GEMINI_API_KEY is not defined. Connect a key in Settings > Secrets for 100% real-time camera and visual analysis.'
      });
    }

    // Call real server-side Gemini 3.5 Flash multi-modal analyzer!
    const promptInstructions = `
      You are an expert Sign Language and Hand Gesture recognition module for SignBridge AI.
      Analyze this image of a hand gesture or sign language shape.
      Translate the gesture into both direct English and direct Hindi textual translations.
      Return a response strictly matching this JSON schema:
      {
        "gestureName": "Direct gesture identifier (e.g., 'Thumbs Up', 'Letter A', 'I Love You', 'Peace', 'Open Palm')",
        "translationEnglish": "The translated message/phrase in English (e.g. 'Good job', 'Hello', 'Everything is OK')",
        "translationHindi": "The translated equivalent message/phrase in clean Devangari Hindi script (e.g. 'बहुत बढ़िया', 'नमस्ते', 'सब ठीक है')",
        "confidence": A confidence score between 0.85 and 0.99 reflecting clarity of the gesture,
        "description": "Short structural description of landmark layout patterns seen"
      }
    `;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/png',
          },
        },
        promptInstructions,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gestureName: { type: Type.STRING },
            translationEnglish: { type: Type.STRING },
            translationHindi: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ['gestureName', 'translationEnglish', 'translationHindi', 'confidence'],
        },
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    const selectedText = language === 'Hindi' ? parsedData.translationHindi : parsedData.translationEnglish;

    res.json({
      ...parsedData,
      extracted_text: selectedText,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Image translation error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze gesture image' });
  }
});

// 4. AI Translation Endpoint - Uploaded Videos (MP4, frame arrays)
app.post('/api/translate/video', async (req, res) => {
  try {
    const { videoFrames, language } = req.body;
    if (!videoFrames || !Array.isArray(videoFrames) || videoFrames.length === 0) {
      return res.status(400).json({ error: 'Video frame sequence is required for timeline evaluation' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // offline simulator
      const timelinePhrases = [
        { timeline: '0.5s - 1.2s', gesture: 'Hello', en: 'Hello', hi: 'नमस्ते' },
        { timeline: '1.5s - 2.8s', gesture: 'I Love You', en: 'I love you', hi: 'मैं तुमसे प्यार करता हूँ' },
        { timeline: '3.2s - 4.5s', gesture: 'Thumbs Up', en: 'Thank you', hi: 'धन्यवाद' }
      ];
      
      const combinedEnglish = timelinePhrases.map(p => p.en).join(' ');
      const combinedHindi = timelinePhrases.map(p => p.hi).join(' ');
      const selectedCombined = language === 'Hindi' ? combinedHindi : combinedEnglish;

      return res.json({
        timeline: timelinePhrases,
        sentenceEnglish: combinedEnglish,
        sentenceHindi: combinedHindi,
        extracted_text: selectedCombined,
        confidence: 0.94,
        isFallback: true,
      });
    }

    // Since sending videos frames as arrays to Gemini, we can bundle them or take the key endpoints and query Gemini
    // to build a coherent sentence.
    const keyFrames = videoFrames.slice(0, 3); // top 3 frames for key milestones
    const contentsPayload: any[] = [];

    keyFrames.forEach((frameBase64: string, index: number) => {
      const cleanB64 = frameBase64.replace(/^data:image\/\w+;base64,/, '');
      contentsPayload.push({
        inlineData: {
          data: cleanB64,
          mimeType: 'image/jpeg',
        }
      });
    });

    contentsPayload.push(
      `These are a sequence of frames taken from a video containing sign language gestures in chronological order.
      Analyze the sequence, identify the hand shapes in each, and compose them into a coherent translated sentence in english and hindi.
      Return a response matching this JSON schema:
      {
        "timeline": [
          {"timeline": "0s - 1s", "gesture": "Shape name", "en": "word 1 English", "hi": "word 1 Hindi"}
        ],
        "sentenceEnglish": "Coherent combined sentence in English",
        "sentenceHindi": "Coherent combined sentence in Hindi",
        "confidence": Combined confidence score between 0.8 to 1.0
      }`
    );

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeline: { type: Type.STRING },
                  gesture: { type: Type.STRING },
                  en: { type: Type.STRING },
                  hi: { type: Type.STRING },
                },
                required: ['timeline', 'gesture', 'en', 'hi'],
              }
            },
            sentenceEnglish: { type: Type.STRING },
            sentenceHindi: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['timeline', 'sentenceEnglish', 'sentenceHindi', 'confidence'],
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const selectedText = language === 'Hindi' ? parsed.sentenceHindi : parsed.sentenceEnglish;

    res.json({
      ...parsed,
      extracted_text: selectedText,
      isFallback: false,
    });

  } catch (error: any) {
    console.error('Video translation error:', error);
    res.status(500).json({ error: error.message || 'Failed to process video timeline translation' });
  }
});

// 5. Advanced Gemini TTS Speech Generation Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        audioBase64: null,
        isFallback: true,
        notice: 'GEMINI_API_KEY missing. Handled cleanly using browser SpeechSynthesis API.'
      });
    }

    // Select suitable voice and request modality audio
    // Ensure Kore voice which sounds pleasant and friendly is selected
    const voiceMode = language === 'Hindi' ? 'Kore' : 'Zephyr';
    const cheerfulInstruct = language === 'Hindi' 
      ? `कृपया स्पष्ट हिंदी में कहें: ${text}` 
      : `${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cheerfulInstruct }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceMode },
          }
        },
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        isFallback: false
      });
    } else {
      res.status(500).json({ error: 'Gemini did not generate audio bytes in response' });
    }

  } catch (error: any) {
    console.error('Speech generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech using Gemini TTS' });
  }
});

// 6. Gemini Q&A and Sign Language Advisor Endpoint
app.post('/api/qa', async (req, res) => {
  try {
    const { question, category, role } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const ai = getGeminiClient();
    const userRoleValue = role || 'Curious Learner';

    // Local function for customized high-quality offline simulated response
    const getOfflineResponse = () => {
      const lower = question.toLowerCase();
      let answer = '';
      let suggestions: string[] = [];

      // Customize suggestions based on role
      if (userRoleValue === 'Speech Therapist') {
        suggestions = [
          "How does sign language aid phonetic speech rehabilitation?",
          "Can you suggest fine motor coordinate finger games?",
          "What is the optimal hand distance for muscle tracking?",
          "How can I customize landmark indicators for therapy sessions?"
        ];
      } else if (userRoleValue === 'Accessibility Dev') {
        suggestions = [
          "How do I read standard 21 landmarks array on a custom canvas?",
          "Is WebGL rendering required for high FPS tracking?",
          "How does the dev proxy route server-side requests?",
          "How can I save translations directly to local storage?"
        ];
      } else if (userRoleValue === 'Sign Language Mentor') {
        suggestions = [
          "What are the best methods to teach Devanagari numerals?",
          "How can dual-hand combination shapes be evaluated?",
          "Explain the difference between English and Hindi finger postures",
          "Tips for assessing structural landmark pose stability"
        ];
      } else {
        suggestions = [
          "How do I sign 'Namaste'?",
          "What are the 21 hand landmarks?",
          "Can I use double handed gestures?",
          "How does the camera calibration work?"
        ];
      }

      if (lower.includes('hello') || lower.includes('namaste') || lower.includes('greet')) {
        answer = `To sign **'Hello'** or **'Namaste'** in SignBridge AI, display an open palm facing forward towards the camera and wave gently, or place both palms together near your chest to trigger the dual-handed **'Namaste / Greeting'** translation.\n\n*Companion Insight for **${userRoleValue}***: Doing so stimulates spatial landmark coordination and is excellent for interactive learning sessions.`;
      } else if (lower.includes('landmark') || lower.includes('point') || lower.includes('mediapipe')) {
        answer = `Our engine uses Google MediaPipe's hand tracking, which maps exactly **21 coordinate points (joints)** on each real-time hand frame. These include the wrist (point 0), thumb nodes (1-4), index finger nodes (5-8), middle finger nodes (9-12), ring finger nodes (13-16), and pinky finger nodes (17-20).\n\n*Companion Insight for **${userRoleValue}***: ${
          userRoleValue === 'Accessibility Dev' 
            ? "Each node has {X, Y, Z} coordinates normalized from 0.0 to 1.0, making calculations easy to compute."
            : "These landmarks act as visual overlays, allowing kids or patients to visually see their joint movements dynamic and aligned."
        }`;
      } else if (lower.includes('two') || lower.includes('double') || lower.includes('both')) {
        answer = `Yes! SignBridge AI supports **double-hand synergy gesture combinations**. In the latest update, you can place both hands in the frame to register combined responses like *'Double Thumbs Up'*, *'Double Peace'*, or compound gestures (e.g., *'Left Hand: Peace • Right Hand: Fist'*).\n\n*Role Advisory:* This is particularly helpful for ${
          userRoleValue === 'Speech Therapist' 
            ? 'enhancing dual-hemisphere brain connectivity and bilateral motor coordination.'
            : userRoleValue === 'Accessibility Dev'
            ? 'supporting complex, multithreaded gesture state-machines in frontend inputs.'
            : 'developing flowing sign vocabulary and natural conversational pacing.'
        }`;
      } else if (lower.includes('accuracy') || lower.includes('improve') || lower.includes('light')) {
        answer = "To improve recognition accuracy: \n\n1. Ensure you are in a well-lit environment. \n2. Keep your hand 1.5 to 3 feet back from the camera lens. \n3. Align your palms flat perpendicular to the camera angle, rather than slanted. \n4. Avoid wearing heavy gloves or busy hand wristwatches.";
      } else if (lower.includes('dictionary') || lower.includes('alphabets') || lower.includes('gestures')) {
        answer = "SignBridge AI includes a comprehensive integrated **Dictionary** of gestures including Alphabets (A, B, C, etc. as finger positions), common words like *'Namaste'*, *'Thumbs Up'*, *'Peace'*, and compound shapes. You can explore the **'Sign Dictionary'** tab on the sidebar for exact English & Hindi descriptions of each shape.";
      } else if (lower.includes('history') || lower.includes('save') || lower.includes('past')) {
        answer = "Every successful translation performed via Live Camera, Image Upload, or Video Upload is securely logged into our translation history database. You can review, search, replay voice audio, or export them as a CSV spreadsheet under the **'History Logs'** on the side menu.";
      } else if (lower.includes('therap') || lower.includes('rehab') || lower.includes('speech')) {
        answer = `As a **${userRoleValue}**, you'll appreciate how hand gesture tracking aids cognitive reinforcement. Sign gesture tasks stimulate neural pathways linking visual, motor, and speech centers, providing an interactive medium for patients recovering from motor dysphasia or children undertaking speech developmental courses.`;
      } else {
        answer = `SignBridge AI stands ready to assist you in your role as a **${userRoleValue}**! To perform this sign: Position your primary hand with fingers relaxed, then move them dynamically in accordance with standard Indian/American sign dictionaries. If you enable the live camera, our AI Flash model will automatically synthesize text translation and speech for your gesture!`;
      }

      return {
        question,
        answer,
        suggestions,
        isFallback: true
      };
    };

    if (!ai) {
      return res.json(getOfflineResponse());
    }

    // Call real server-side Gemini 3.5 Flash inside a resilient try/catch block
    try {
      const promptInstructions = `
        You are an expert Sign Language Educator, Speech therapist, and advisor for SignBridge AI.
        The user is asking a question or looking for instructions about sign language, hand landmarks, or how our system works.
        
        Adopt an specialized persona matched to the user's role profile: "${userRoleValue}". 
        - If they are a "Speech Therapist", tailor your explanation to focus on motor skills, physical articulation, muscle rehabilitation, and speech therapy benefits. Use simple, supportive, medical or therapeutic terminology.
        - If they are an "Accessibility Dev", include useful technical insights, Web APIs, coordinate manipulation, MediaPipe tracking, or Canvas coordinate mapping.
        - If they are a "Sign Language Mentor", share instructional methodologies, spelling exercise plans, how to coach students, and common physical signing pitfalls.
        - If they are a "Curious Learner", keep it highly energetic, visual, engaging, easy to digest, with encouraging steps and fun hand tracking facts.
        
        Respond in an incredibly clear, encouraging, friendly, and informative manner. Include both English guidance and, if helpful, brief Devanagari Hindi equivalents or instructions. Keep it within 3-4 concise paragraphs. Use beautiful markdown formatting where appropriate (e.g. bold terms, lists).
        
        Provide a response strictly matching this JSON schema:
        {
          "question": "The original question asked",
          "answer": "Detailed markdown formatted explanation answer",
          "suggestions": ["A list of 3-4 related recommended follow-up questions the user can ask"]
        }
      `;

      const response = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: [
          {
            text: `User Question: "${question}"${category ? ` (Theme group: ${category})` : ''}`
          },
          promptInstructions
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['question', 'answer']
          }
        }
      });

      const parsedData = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        ...parsedData,
        isFallback: false
      });
    } catch (geminiError: any) {
      console.warn("Gemini execution for Q&A failed, falling back to local simulation model:", geminiError);
      return res.json(getOfflineResponse());
    }

  } catch (error: any) {
    console.error('Q&A assistance error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate assistance reply' });
  }
});

// --- VITE MIDDLEWARE AND STANDALONE INGRESS HANDLING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignBridge AI] Full-stack server running perfectly on port ${PORT}`);
  });
}

startServer();
