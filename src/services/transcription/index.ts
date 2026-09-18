import { TranscriptionProvider as ProviderType } from '../../types';
import { TranscriptionProviderInterface } from './types';
import { GeminiTranscribeProvider } from './gemini';
import { GroqWhisperProvider } from './groq';
import { VoxtralRealtimeProvider } from './voxtral';
import { BrowserSpeechProvider } from './browser';

export function createProvider(type: ProviderType): TranscriptionProviderInterface {
  switch (type) {
    case 'gemini':
      return new GeminiTranscribeProvider();
    case 'groq':
      return new GroqWhisperProvider();
    case 'voxtral':
      return new VoxtralRealtimeProvider();
    case 'browser':
      return new BrowserSpeechProvider();
    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}

export type { TranscriptionProviderInterface, TranscriptionCallbacks } from './types';
