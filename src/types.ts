export type InputType = 'live_camera' | 'image_upload' | 'video_upload';

export interface TranslationItem {
  id: string;
  input_type: InputType;
  extracted_text: string;
  language: 'English' | 'Hindi';
  confidence: number;
  created_at: string;
}

export interface UserSettings {
  language: 'English' | 'Hindi';
  auto_speech: boolean;
  auto_save: boolean;
  theme: 'Dark' | 'Light';
}

export interface HandGestureGuide {
  id: string;
  name: string;
  descriptionEnglish: string;
  descriptionHindi: string;
  category: 'Alphabets' | 'Words' | 'Phrases';
  iconName: string;
}

export type ActivePage = 'landing' | 'dashboard' | 'live' | 'image' | 'video' | 'history' | 'settings' | 'dictionary' | 'qa';

export interface UserSession {
  username: string;
  email: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
}

