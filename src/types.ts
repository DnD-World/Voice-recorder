export type TranscriptionProvider = 'gemini' | 'groq' | 'voxtral' | 'browser';

export interface AppSettings {
  provider: TranscriptionProvider;
  geminiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  language: string;
  googleDocsEnabled: boolean;
  googleDocsId: string;
  googleDriveEnabled: boolean;
  googleDriveFolderId: string;
  emailEnabled: boolean;
  emailAddress: string;
  autoSaveInterval: number; // seconds
  smartTranscription: boolean;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptionState {
  isRecording: boolean;
  isConnecting: boolean;
  interimText: string;
  segments: TranscriptionSegment[];
  fullText: string;
  error: string | null;
  lastSaveTime: number | null;
  sessionDuration: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  geminiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  language: 'el-GR',
  googleDocsEnabled: false,
  googleDocsId: '',
  googleDriveEnabled: false,
  googleDriveFolderId: '',
  emailEnabled: false,
  emailAddress: '',
  autoSaveInterval: 60,
  smartTranscription: false,
};

export const PROVIDER_INFO: Record<TranscriptionProvider, { name: string; description: string; needsKey: boolean }> = {
  gemini: {
    name: 'Gemini 3.5 Transcribe Live',
    description: 'Google\'s real-time transcription. Excellent for Greek. WebSocket streaming.',
    needsKey: true,
  },
  groq: {
    name: 'Whisper Large V3 (Groq)',
    description: 'Fast multilingual transcription via Groq API. Good Greek support.',
    needsKey: true,
  },
  voxtral: {
    name: 'Voxtral Mini Realtime',
    description: 'Mistral\'s realtime transcription. Sub-200ms latency. Supports 13 languages.',
    needsKey: true,
  },
  browser: {
    name: 'Browser Speech Recognition',
    description: 'Built-in browser API. No API key needed. Variable quality for Greek.',
    needsKey: false,
  },
};
