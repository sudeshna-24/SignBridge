import os
from gtts import gTTS
import uuid

# Ensure upload directory structure exists for caching
CACHE_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR, recursive=True)

def generate_speech_file(text: str, language: str) -> str:
    """
    Synthesizes speech using gTTS and returns the absolute file path,
    designed to easily load voice output.
    """
    # Select language code based on preferences
    lang_code = "hi" if language.lower() == "hindi" else "en"
    
    # Initialize Google Text To Speech
    tts = gTTS(text=text, lang=lang_code, slow=False)
    
    file_id = f"speech_{uuid.uuid4().hex[:10]}.mp3"
    filepath = os.path.join(CACHE_DIR, file_id)
    
    tts.save(filepath)
    return filepath
