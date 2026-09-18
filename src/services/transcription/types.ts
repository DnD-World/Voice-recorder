import { AppSettings, TranscriptionSegment } from '../../types';

export interface TranscriptionCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export interface TranscriptionProviderInterface {
  start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void>;
  sendAudio(chunk: Float32Array): void;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export type { AppSettings, TranscriptionSegment };
