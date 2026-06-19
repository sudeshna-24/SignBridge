<div align="center">

# 🤟 SignBridge AI

### Real-Time Sign Language ↔ Speech & Text Translation Platform

**Bridging communication between the hearing-impaired and hearing communities through AI, computer vision, and natural speech synthesis — in English & Hindi.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#-license)
[![TypeScript](https://img.shields.io/badge/TypeScript-92.9%25-3178C6?logo=typescript&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-6.2%25-3776AB?logo=python&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](#)

</div>

---

## 📸 Preview

<div align="center">
  <img src="assets/screenshots/landing-page.png" alt="SignBridge AI landing page showing the live MediaPipe translation dashboard" width="850"/>
  <p><em>SignBridge AI landing dashboard — live camera translation, image analysis, and video decomposition tools in one workspace.</em></p>
</div>

---

## 📖 Overview

**SignBridge AI** is a full-stack accessibility platform that translates hand gestures and sign language into readable text and natural speech, in real time. It supports three input modes — **live webcam feeds**, **static image uploads**, and **video files** — and produces bilingual (**English** + **Hindi**) text and audio output.

The project ships with two complementary engines so it can run as a fast, AI-Studio-ready web app *or* as a standalone, production-grade API:

| Engine | Stack | Purpose |
|---|---|---|
| **Web App** | React 19 + Vite + Express | Browser-based UI with live MediaPipe hand tracking and a Gemini-powered translation proxy |
| **Core API** | FastAPI + MediaPipe + OpenCV | Standalone REST backend for landmark extraction, classification, history, and text-to-speech |

---

## ✨ Key Features

- 🎥 **Live Camera Translation** — Real-time hand landmark tracking via MediaPipe rendered directly on the browser canvas
- 🖼️ **Image Upload Analysis** — Drag-and-drop a photo to translate a static gesture
- 🎞️ **Video Decomposition** — Breaks a video into a gesture timeline and stitches it into a full sentence
- 🌐 **Bilingual Output** — Every translation is produced in both **English** and **Hindi**
- 🔊 **Text-to-Speech** — Natural spoken playback of translated text via Google TTS
- 📖 **Sign Dictionary** — Searchable glossary of gestures with bilingual definitions
- 🕘 **History Logs** — Stores, filters, and exports past translations
- ⚙️ **User Preferences** — Configurable settings for language, voice, and detection sensitivity
- 🔐 **Login Gate** — Lightweight authentication screen guarding the workspace

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (glassmorphic UI)
- `lucide-react` icons · `motion` animations · `react-markdown`

**Web Server / AI Proxy**
- Express + `tsx`
- Google GenAI SDK (`@google/genai`) for Gemini-based image/video/TTS inference

**Core Backend (`/backend`)**
- FastAPI + Uvicorn
- MediaPipe Hands + OpenCV for landmark extraction and gesture classification
- SQLite for translation history and settings persistence
- gTTS for offline speech synthesis

---

## 📁 Project Structure

```
SignBridge/
├── assets/
│   └── screenshots/             # README preview images
├── backend/                     # Standalone Python/FastAPI core
│   ├── main.py                  # API routes & app startup
│   ├── database.py              # SQLite connection & schema
│   ├── models.py                # Pydantic request/response models
│   ├── gtts_service.py          # Text-to-speech synthesis
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # App navigation
│   │   └── GestureIllustration.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx      # Marketing/landing dashboard
│   │   ├── LoginGate.tsx        # Auth gate
│   │   ├── Dashboard.tsx        # Onboarding & quick actions
│   │   ├── LiveCamera.tsx       # Real-time webcam translator
│   │   ├── ImageUpload.tsx      # Image-based translator
│   │   ├── VideoUpload.tsx      # Video timeline translator
│   │   ├── DictionaryModule.tsx # Searchable sign dictionary
│   │   ├── HistoryModule.tsx    # Translation history & export
│   │   └── SettingsModule.tsx   # User preferences
│   ├── services/
│   │   └── api.ts               # Frontend → backend API client
│   ├── utils/
│   │   └── gesturesData.ts      # Bilingual gesture glossary
│   ├── App.tsx
│   ├── types.ts
│   ├── index.css
│   └── main.tsx
├── server.ts                    # Express server + Gemini proxy
├── index.html
├── metadata.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for the core backend)
- A [Gemini API key](https://aistudio.google.com/) if you intend to use AI-powered translation

### Option A — Web App (React + Express)

```bash
# 1. Clone the repository
git clone https://github.com/sudeshna-24/SignBridge.git
cd SignBridge

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then edit .env and add your GEMINI_API_KEY

# 4. Run the dev server
npm run dev
```

Visit **http://localhost:3000** in your browser.

### Option B — Core Python API (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Launch the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit **http://localhost:8000/docs** for the interactive Swagger UI.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET`  | `/` | Health check |
| `POST` | `/api/translate/image` | Translate a single image into bilingual text |
| `POST` | `/api/translate/video` | Decompose a video into a gesture timeline and full sentence |
| `GET`  | `/api/history` | Retrieve saved translation history |
| `POST` | `/api/history` | Save a translation to history |
| `DELETE` | `/api/history/{item_id}` | Delete a history entry |
| `GET`  | `/api/settings` | Retrieve user settings |
| `POST` | `/api/settings` | Update user settings |
| `POST` | `/api/tts` | Generate spoken audio from text |

**Example — Image Translation**

Request:
```json
POST /api/translate/image
{
  "imageBase64": "data:image/jpeg;base64,...",
  "language": "Hindi"
}
```

Response:
```json
{
  "gestureName": "I Love You",
  "translationEnglish": "I Love You",
  "translationHindi": "मैं तुमसे प्यार करता हूँ",
  "confidence": 0.98
}
```

---

## 🔒 Security & Validation

- Upload validation by file extension (`.jpg`, `.png`, `.mp4`, `.mov`, `.avi`) and size (5MB images / 15MB video)
- Camera access only over HTTPS via the browser sandbox; landmark coordinates are computed client-side, frames are never persisted
- API keys are read from environment variables and never committed to source control

---

## 🗺️ Roadmap

- [ ] Expand the sign dictionary with regional dialect variants
- [ ] Offline/on-device inference mode
- [ ] Mobile-responsive camera capture
- [ ] Additional language support beyond English/Hindi

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss what you'd like to change, then submit a pull request.

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Built with ❤️ by **[Sudeshna Roy](https://github.com/sudeshna-24)**

</div>
