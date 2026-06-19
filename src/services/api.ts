import { TranslationItem, UserSettings, InputType } from '../types';

const API_BASE = '/api';

export async function fetchHistory(): Promise<TranslationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to load translations list');
    return await res.json();
  } catch (error) {
    console.error('fetchHistory error:', error);
    return [];
  }
}

export async function addHistoryItem(
  input_type: InputType,
  extracted_text: string,
  language: 'English' | 'Hindi',
  confidence: number
): Promise<TranslationItem | null> {
  try {
    const res = await fetch(`${API_BASE}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_type, extracted_text, language, confidence }),
    });
    if (!res.ok) throw new Error('Failed to add translation');
    return await res.json();
  } catch (error) {
    console.error('addHistoryItem error:', error);
    return null;
  }
}

export async function removeHistoryItem(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete history item');
    return true;
  } catch (error) {
    console.error('removeHistoryItem error:', error);
    return false;
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return true;
  } catch (error) {
    console.error('clearAllHistory error:', error);
    return false;
  }
}

export async function fetchSettings(): Promise<UserSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to read config settings');
    return await res.json();
  } catch (error) {
    console.error('fetchSettings error:', error);
    return {
      language: 'English',
      auto_speech: true,
      auto_save: true,
      theme: 'Dark'
    };
  }
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings preferences');
    return await res.json();
  } catch (error) {
    console.error('updateSettings error:', error);
    return null;
  }
}

export interface ImageTranslationResponse {
  gestureName: string;
  translationEnglish: string;
  translationHindi: string;
  extracted_text: string;
  confidence: number;
  description?: string;
  isFallback: boolean;
  notice?: string;
}

export async function translateImageApi(
  imageBase64: string,
  mimeType: string,
  language: 'English' | 'Hindi'
): Promise<ImageTranslationResponse> {
  const res = await fetch(`${API_BASE}/translate/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, language }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to translate gestured image');
  }
  return await res.json();
}

export interface VideoTimelineResponse {
  timeline: Array<{ timeline: string; gesture: string; en: string; hi: string }>;
  sentenceEnglish: string;
  sentenceHindi: string;
  extracted_text: string;
  confidence: number;
  isFallback: boolean;
}

export async function translateVideoApi(
  videoFrames: string[],
  language: 'English' | 'Hindi'
): Promise<VideoTimelineResponse> {
  const res = await fetch(`${API_BASE}/translate/video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoFrames, language }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to translate video files');
  }
  return await res.json();
}

export interface TtsResponse {
  audioBase64: string | null;
  mimeType?: string;
  isFallback: boolean;
  notice?: string;
}

export async function generateSpeechApi(
  text: string,
  language: 'English' | 'Hindi'
): Promise<TtsResponse> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error('Speech generator error');
  return await res.json();
}


export interface QAResponse {
  question: string;
  answer: string;
  suggestions?: string[];
  isFallback: boolean;
}

export async function askAiQuestionApi(
  question: string,
  category?: string,
  role?: string
): Promise<QAResponse> {
  const res = await fetch(`${API_BASE}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, category, role }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to answer question');
  }
  return await res.json();
}

