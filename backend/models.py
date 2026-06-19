from pydantic import BaseModel, Field
from typing import Optional, List

class TranslationCreate(BaseModel):
    input_type: str = Field(..., description="live_camera, image_upload, or video_upload")
    extracted_text: str = Field(..., description="Recognized word or phrase")
    language: str = Field(..., description="English or Hindi")
    confidence: float = Field(..., description="Recognition confidence score")

class TranslationResponse(BaseModel):
    id: str
    input_type: str
    extracted_text: str
    language: str
    confidence: float
    created_at: str

class SettingsSchema(BaseModel):
    language: str = Field("English", description="English or Hindi")
    auto_speech: bool = Field(True, description="Enable automatic voice readout")
    auto_save: bool = Field(True, description="Enable database storage saving")
    theme: str = Field("Dark", description="Dark or Light")

class ImageTranslateRequest(BaseModel):
    imageBase64: str = Field(..., description="Base64 encoded PNG/JPG data")
    mimeType: Optional[str] = "image/png"
    language: Optional[str] = "English"

class VideoTranslateRequest(BaseModel):
    videoFrames: List[str] = Field(..., description="List of base64 frames")
    language: Optional[str] = "English"

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "English"

