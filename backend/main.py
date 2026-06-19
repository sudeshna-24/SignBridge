import os
import base64
import json
import uuid
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import cv2
import numpy as np
import mediapipe as mp

try:
    from .database import init_db, get_db_connection
    from .models import (
        TranslationCreate,
        TranslationResponse,
        SettingsSchema,
        ImageTranslateRequest,
        VideoTranslateRequest,
        TTSRequest
    )
    from .gtts_service import generate_speech_file
except ImportError:
    from database import init_db, get_db_connection
    from models import (
        TranslationCreate,
        TranslationResponse,
        SettingsSchema,
        ImageTranslateRequest,
        VideoTranslateRequest,
        TTSRequest
    )
    from gtts_service import generate_speech_file

app = FastAPI(
    title="SignBridge AI - Backend API",
    description="Live MediaPipe gesture translation, model predictions, history, and gTTS generator",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on starthup
@app.on_event("startup")
def startup_event():
    init_db()

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands_detector = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5
)

# Quick rule-based classification heuristics for hand landmarks
def classify_landmarks(landmarks) -> str:
    """
    Analyzes landmarks returned by MediaPipe to detect key signs like Hello, Thumbs Up,
    Peace, I Love You, or OK.
    """
    # Landmarks map (0-20): 4 is thumb tip, 8 is index tip, 12 is middle tip, 16 is ring tip, 20 is pinky tip
    # We check if fingers are extended by comparing tip Y position with joint Y position.
    
    # helper: is finger extended? (for index, middle, ring, pinky)
    # y-axis points down, so smaller y means higher hand position!
    index_up = landmarks[8]['y'] < landmarks[6]['y']
    middle_up = landmarks[12]['y'] < landmarks[10]['y']
    ring_up = landmarks[16]['y'] < landmarks[14]['y']
    pinky_up = landmarks[20]['y'] < landmarks[18]['y']
    
    # Thumb can be tricky, check x position relative to joint x
    thumb_side = abs(landmarks[4]['x'] - landmarks[2]['x']) > 0.05
    thumb_up = landmarks[4]['y'] < landmarks[3]['y'] and landmarks[4]['y'] < landmarks[5]['y']
    
    # 1. 5 fingers open (Hello / Wave)
    if index_up and middle_up and ring_up and pinky_up:
         return "Hello / Stop"
         
    # 2. Thumbs Up
    if thumb_up and not index_up and not middle_up and not ring_up and not pinky_up:
        return "Thumbs Up"
        
    # 3. Peace / Victory ('V' Sign)
    if index_up and middle_up and not ring_up and not pinky_up:
        return "Peace"
        
    # 4. I Love You (ILY - Pinky, Index, Thumb up)
    if thumb_up and index_up and pinky_up and not middle_up and not ring_up:
        return "I Love You"
        
    # 5. OK Gesture (index tips near thumb tip)
    dx = abs(landmarks[8]['x'] - landmarks[4]['x'])
    dy = abs(landmarks[8]['y'] - landmarks[4]['y'])
    if dx < 0.08 and dy < 0.08 and middle_up and ring_up and pinky_up:
        return "OK"
        
    # Default fallback
    return "Hand Detected"

@app.get("/")
def read_root():
    return {
        "app": "SignBridge AI Backend",
        "status": "Online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# --- LANDMARK EXTRACTION AND CLASSIFICATION ---
@app.post("/api/translate/image")
def translate_hand_image(payload: ImageTranslateRequest):
    """
    Processes base64 encoded images with OpenCV and MediaPipe Hands,
    extracts coordinates, classifies the hand gesture, and translates to english/hindi.
    """
    try:
        # Decode base64
        header, encoded = payload.imageBase64.split(",", 1) if "," in payload.imageBase64 else ("", payload.imageBase64)
        img_data = base64.b64decode(encoded)
        
        # Convert to numpy array and decode to CV2 image
        nparr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Corrupted image file or invalid base64")
            
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process image using MediaPipe Hands
        results = hands_detector.process(image_rgb)
        
        gesture_name = "No hand detected"
        confidence = 0.0
        landmarks_list = []
        
        if results.multi_hand_landmarks:
            # We take the first hand detected
            hand_landmarks = results.multi_hand_landmarks[0]
            confidence = results.multi_handedness[0].classification[0].score
            
            # Extract landmark coordinates
            for lm in hand_landmarks.landmark:
                landmarks_list.append({
                    "x": lm.x,
                    "y": lm.y,
                    "z": lm.z
                })
                
            # Classify gesture based on landmark coordinates
            gesture_name = classify_landmarks(landmarks_list)
        else:
             raise HTTPException(status_code=422, detail="No hands detected in the image canvas. Please position hand clearly in frame.")

        # Static sign translations dictionary
        translations_dict = {
            "Hello / Stop": {"en": "Hello, please stop there.", "hi": "नमस्ते, कृपया वहाँ रुकें।"},
            "Thumbs Up": {"en": "Everything is great!", "hi": "सब कुछ बहुत बढ़िया है!"},
            "Peace": {"en": "Peace and Victory", "hi": "शांति और विजय"},
            "I Love You": {"en": "I love you truly", "hi": "मैं वास्तव में आपसे प्रेम करता हूँ"},
            "OK": {"en": "Perfect, it is correct.", "hi": "बिल्कुल सही, यह सही है।"},
            "Hand Detected": {"en": "Analyzing gesture...", "hi": "हावभाव का विश्लेषण कर रहे हैं..."}
        }
        
        chosen_language = payload.language or "English"
        texts = translations_dict.get(gesture_name, {"en": "Understood gesture", "hi": "हावभाव समझ आ गया"})
        extracted_text = texts["hi"] if chosen_language.lower() == "hindi" else texts["en"]
        
        return {
            "gestureName": gesture_name,
            "translationEnglish": texts["en"],
            "translationHindi": texts["hi"],
            "extracted_text": extracted_text,
            "confidence": round(float(confidence), 2),
            "created_at": datetime.now().isoformat(),
            "landmarks_count": len(landmarks_list)
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid payload format: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate/video")
def translate_hand_video(payload: VideoTranslateRequest):
    """
    Takes an array of frames, runs MediaPipe frame-by-frame,
    and returns a timeline of gestures building a sentence.
    """
    timeline = []
    gestures_found = []
    
    # Process up to 3 frames to avoid processing timeouts
    frame_indices = [0, len(payload.videoFrames)//2, len(payload.videoFrames)-1] if len(payload.videoFrames) > 2 else range(len(payload.videoFrames))
    
    for count, idx in enumerate(frame_indices):
        if idx >= len(payload.videoFrames):
             continue
        frame_b64 = payload.videoFrames[idx]
        try:
            header, encoded = frame_b64.split(",", 1) if "," in frame_b64 else ("", frame_b64)
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                results = hands_detector.process(img_rgb)
                
                if results.multi_hand_landmarks:
                    hand_lms = results.multi_hand_landmarks[0]
                    lms_list = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lms.landmark]
                    gest = classify_landmarks(lms_list)
                    if gest != "Hand Detected" and gest not in gestures_found:
                         gestures_found.append(gest)
                         timeline.append({
                             "timeline": f"Frame {idx+1}",
                             "gesture": gest,
                             "en": gest,
                             "hi": gest
                         })
        except Exception:
             continue
             
    # Connect words together to compose readable sentences
    sentence_en = " ".join([g for g in gestures_found]) if gestures_found else "No gestures parsed"
    sentence_hi = " ".join([g for g in gestures_found]) if gestures_found else "कोई संकेत नहीं मिले"
    
    chosen_lang = payload.language or "English"
    extracted = sentence_hi if chosen_lang.lower() == "hindi" else sentence_en
    
    return {
        "timeline": timeline,
        "sentenceEnglish": sentence_en,
        "sentenceHindi": sentence_hi,
        "extracted_text": extracted,
        "confidence": 0.90 if gestures_found else 0.0
    }

# --- DATABASE OPERATIONS ---
@app.get("/api/history")
def read_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM translations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    history_list = []
    for row in rows:
        history_list.append({
            "id": row["id"],
            "input_type": row["input_type"],
            "extracted_text": row["extracted_text"],
            "language": row["language"],
            "confidence": row["confidence"],
            "created_at": row["created_at"]
        })
    conn.close()
    return history_list

@app.post("/api/history")
def write_history_item(payload: TranslationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    item_id = f"tx_{int(time.time())}_{uuid.uuid4().hex[:4]}"
    created_at = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO translations (id, input_type, extracted_text, language, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (item_id, payload.input_type, payload.extracted_text, payload.language, payload.confidence, created_at)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": item_id,
        **payload.dict(),
        "created_at": created_at
    }

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM translations WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"success": True, "id": item_id}

# --- SETTINGS GET AND SET ---
@app.get("/api/settings")
def load_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT language, auto_speech, auto_save, theme FROM settings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "language": row["language"],
            "auto_speech": bool(row["auto_speech"]),
            "auto_save": bool(row["auto_save"]),
            "theme": row["theme"]
        }
    return {
        "language": "English",
        "auto_speech": True,
        "auto_save": True,
        "theme": "Dark"
    }

@app.post("/api/settings")
def store_settings(updated: SettingsSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE settings SET language = ?, auto_speech = ?, auto_save = ?, theme = ? WHERE id = (SELECT id FROM settings LIMIT 1)",
        (updated.language, int(updated.auto_speech), int(updated.auto_save), updated.theme)
    )
    conn.commit()
    conn.close()
    return updated

# --- TEXT TO SPEECH ---
@app.post("/api/tts")
def stream_tts(payload: TTSRequest):
    """Generates speech file using gtts and returns JSON with base64 encoded audio."""
    try:
        mp3_filepath = generate_speech_file(payload.text, payload.language)
        with open(mp3_filepath, "rb") as f:
            audio_bytes = f.read()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Clean up files from cache to avoid leakages
        try:
            os.remove(mp3_filepath)
        except Exception:
            pass
            
        return {
            "audioBase64": audio_b64,
            "mimeType": "audio/mpeg",
            "isFallback": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"gTTS Speech Synthesizer failure: {str(e)}")
