# SignBridge AI – Accessibility Translation Platform

SignBridge AI is a state-of-the-art, production-ready sign language and hand gesture translation platform designed to bridge the communication gap between hearing-impaired individuals and non-sign-language speakers. It translates live camera feeds, static images, and continuous video inputs into high-fidelity textual strings and natural spoken speech outputs in both **English** and **Hindi**.

---

## 🚀 Dual-Engine Architecture

This repository contains a **hybrid full-stack architecture** optimized for dual operational deployment:

1. **Development & Preview Engine (Node.js + Express + Vite)**:
   - Built to run seamlessly within the sandboxed Cloud Run hosting space.
   - Handles real-time MediaPipe landmarks drawing on client browsers at 30+ FPS.
   - Proxies multi-modal visual payloads and TTS requests securely to the **Google GenAI Python core SDK** via server-side endpoints on port `3000`.

2. **Production-Ready Core (Python + FastAPI + MediaPipe Hands + SQLite)**:
   - Located inside the `/backend` folder.
   - Implements advanced landmark vector bounding coordinate extraction to heuristically classify poses.
   - Provides full-featured REST endpoints, validates media uploads, synthesizes translations with `gTTS`, and persists transactions in SQLite tables.

---

## 🛠️ Tech Stack & Dependencies

### Frontend (React v19 SPA)
- **Vite & TypeScript**: Standard modular bundling and strict type safety layers.
- **Tailwind CSS (v4)**: Modern, custom-compiled responsive glassmorphic utility classes.
- **Lucide-React**: Unified, highly aesthetic iconography.
- **MediaPipe Hands**: Dynamic browser-side neural model tracking hand landmarks.

### Backend (Full-Stack Express + Python FastAPI)
- **Express**: Captures frame base64 snapshots and manages file-based SQLite emulation caching.
- **Google GenAI SDK**: Powers the server-side visual translational parser using the advanced `gemini-3.5-flash` and `gemini-3.1-flash-tts-preview` modules.
- **FastAPI / Uvicorn**: High-performance Python core server.
- **OpenCV & MediaPipe Hands**: Decodes image binary grids and connects 21 3D landmarks for heuristic classification.
- **sqlite3 / SQLite**: Stores historical entries with indexes.
- **gTTS (Google Text-To-Speech)**: Translates outputs into offline spoken wave files.

---

## 📁 Repository Folder Structure

```text
signbridge-ai/
├── backend/                    # Core Python Production Backend
│   ├── main.py                 # Central FastAPI endpoints & routing
│   ├── database.py             # SQLite structure setup & connections
│   ├── models.py               # Pydantic validation schemas
│   ├── gtts_service.py         # Google Text-to-Speech synthesis
│   └── requirements.txt        # Python backend packages list
├── database/                   # Persistent data structures folder
│   ├── translations.json       # SQLite emulated transactions
│   └── settings.json           # Interactive preference configs
├── src/                        # Modular React Frontend Space
│   ├── components/
│   │   └── Sidebar.tsx         # Responsive sidebar navigation header
│   ├── pages/
│   │   ├── Dashboard.tsx       # Onboarding cards & visual cheat-sheet
│   │   ├── LiveCamera.tsx      # Real-time skeleton tracking and audio readout
│   │   ├── ImageUpload.tsx     # Drag-and-drop JPEG/PNG translator
│   │   ├── VideoUpload.tsx     # Frame sequence timeliner and sentence builder
│   │   ├── HistoryModule.tsx   # Search, filters, and CSV exporters
│   │   └── SettingsModule.tsx  # Interactive configurations UI
│   ├── utils/
│   │   └── gesturesData.ts     # Bilingual signs glossary dictionary
│   ├── App.tsx                 # Master structural layout assembler
│   ├── types.ts                # TypeScript shared models
│   ├── index.css               # Font imports and glassmorphic frames styles
│   └── main.tsx                # Frontend engine entry
├── server.ts                   # Full-Stack Express and Gemini proxy backend
├── package.json                # Frontend dev & esbuild starter files
└── metadata.json               # Accessibility frame permissions metadata
```

---

## ⚙️ How to Run & Deploy

### Option A: Local Dev & Live Preview (Fully Configured)

This mode launches the complete React 19 interface paired with the Server-Side Express Proxy, executing 100% of translational flows inside the workspace canvas!

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Launches the Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Configure API Secrets**:
   To enable high-fidelity Gemini AI analysis for frame captures, images, and high-fidelity TTS file generations:
   - Access **Settings > Secrets** in the UI.
   - Create a variable named `GEMINI_API_KEY` and populate it with your personal key.

---

### Option B: Core Python FastAPI Backend (Production Build)

These files are located in `/backend` and represent the complete standalone API product.

1. **Navigate to the Backend Folder**:
   ```bash
   cd backend
   ```

2. **Create Python Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Core Requirements**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Access the interactive swagger document page at `http://localhost:8000/docs`.

---

## 📡 API Reference Documentation

### 1. Image Translate Pipeline
- **Endpoint**: `POST /api/translate/image`
- **Payload**:
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "language": "Hindi"
  }
  ```
- **Response**:
  ```json
  {
    "gestureName": "I Love You",
    "translationEnglish": "I Love You",
    "translationHindi": "मैं तुमसे प्यार करता हूँ",
    "extracted_text": "मैं तुमसे प्यार करता हूँ",
    "confidence": 0.98
  }
  ```

### 2. Video Timeline Compiler
- **Endpoint**: `POST /api/translate/video`
- **Payload**:
  ```json
  {
    "videoFrames": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."]
  }
  ```
- **Response**:
  ```json
  {
    "timeline": [
      { "timeline": "0.5s", "gesture": "Hello", "en": "Hello", "hi": "नमस्ते" }
    ],
    "sentenceEnglish": "Hello and welcome to building accessibility",
    "sentenceHindi": "नमस्ते और पहुंच निर्माण में आपका स्वागत है"
  }
  ```

### 3. TTS Speech Generator
- **Endpoint**: `POST /api/tts`
- **Payload**:
  ```json
  {
    "text": "Hello world welcome",
    "language": "English"
  }
  ```
- **Response**: Returns direct raw audio PCM chunks/MP3 file responses.

---

## 🔒 Security & Safe Operations
- **Upload Validation**: File uploads are rigidly validated by format extensions (`.jpg`, `.png`, `.mp4`. `.mov`, `.avi`) and sizes (max 5MB for photos; 15MB for video timelines) to safeguard backend processes from buffer overruns or infinite processing stalls.
- **Sandbox Compliance**: Webcams operate via HTTPS standard browser sandbox controls. Hand landmark coordinates are drawn dynamically on offscreen canvas boxes, keeping actual frame sequences fully private.
