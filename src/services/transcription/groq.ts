import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';
import { float32To16BitPCM } from '../audioCapture';

/**
 * Groq Whisper Large V3 provider
 * Uses REST API with audio chunks for near-real-time transcription
 * Sends audio every ~3 seconds for a good balance of latency and accuracy
 * 
 * NOTE: This is NOT true live streaming - it sends chunks every 3 seconds.
 * Described as "near-real-time" in the UI.
 */
export class GroqWhisperProvider implements TranscriptionProviderInterface {
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;
  private audioBuffer: Float32Array[] = [];
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private settings: AppSettings | null = null;
  private isProcessing = false; // Prevent overlapping requests

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.settings = settings;
    
    if (!settings.groqApiKey) {
      callbacks.onError('Groq API key is required');
      return;
    }

    this.running = true;
    this.audioBuffer = [];
    this.isProcessing = false;
    
    // Process audio chunks every 3 seconds
    this.processingInterval = setInterval(() => {
      this.processBuffer();
    }, 3000);

    callbacks.onConnected();
  }

  sendAudio(chunk: Float32Array): void {
    if (!this.running) return;
    this.audioBuffer.push(new Float32Array(chunk));
  }

  private async processBuffer(): Promise<void> {
    if (this.audioBuffer.length === 0 || !this.settings || !this.callbacks) return;
    if (this.isProcessing) return; // Skip if previous request still in progress
    
    this.isProcessing = true;
    
    // Concatenate all buffered chunks
    const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    this.audioBuffer = []; // Clear buffer before processing
    
    // Convert to WAV format for the API
    const wavBlob = this.createWavBlob(combined);
    
    try {
      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', this.settings.language ? this.settings.language.split('-')[0] : 'el');
      formData.append('response_format', 'json');
      formData.append('temperature', '0');
      
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.groqApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      if (result.text && result.text.trim()) {
        this.callbacks?.onFinal(result.text.trim());
      }
    } catch (error) {
      console.error('Groq transcription error:', error);
      this.callbacks?.onError(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      this.isProcessing = false;
    }
  }

  private createWavBlob(pcmData: Float32Array): Blob {
    const pcm16 = float32To16BitPCM(pcmData);
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcm16.byteLength;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Copy PCM data
    new Uint8Array(buffer, 44).set(new Uint8Array(pcm16));
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Process any remaining audio
    await this.processBuffer();
    this.audioBuffer = [];
    
    this.callbacks?.onDisconnected();
  }

  isRunning(): boolean {
    return this.running;
  }
}
