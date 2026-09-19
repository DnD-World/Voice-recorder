import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';
import { float32ToBase64PCM } from '../audioCapture';

/**
 * Gemini Live Transcription provider
 * Uses WebSocket to stream audio and receive real-time transcriptions
 * 
 * NOTE: The API key is passed in the WebSocket URL. This is acceptable
 * for private Tailscale networks but should be proxied for public deployments.
 */
export class GeminiLiveProvider implements TranscriptionProviderInterface {
  private ws: WebSocket | null = null;
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;
  private setupComplete = false;
  private finalTranscriptPending = false;

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.setupComplete = false;
    this.finalTranscriptPending = false;
    
    if (!settings.geminiApiKey) {
      callbacks.onError('Gemini API key is required');
      return;
    }

    return new Promise((resolve, reject) => {
      // API key in URL (browser WebSocket limitation - no custom headers)
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${settings.geminiApiKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        if (!this.setupComplete) {
          reject(new Error('Connection timeout - check your API key'));
          this.ws?.close();
        }
      }, 15000);

      this.ws.onopen = () => {
        // Send setup message with correct model name
        const setupMessage = {
          setup: {
            model: 'models/gemini-2.0-flash-live-001',
            generationConfig: {
              responseModalities: ['TEXT'],
            },
            inputAudioTranscription: {
              languageCodes: settings.language ? [settings.language] : ['el-GR'],
              ...(settings.smartTranscription ? { mode: 'SMART' } : {}),
            },
          },
        };
        
        this.ws?.send(JSON.stringify(setupMessage));
        this.running = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          // Handle setup complete
          if (response.setupComplete) {
            console.log('Gemini setup complete');
            this.setupComplete = true;
            clearTimeout(connectionTimeout);
            callbacks.onConnected();
            resolve();
            return;
          }
          
          const serverContent = response.serverContent;
          if (!serverContent) return;

          // Handle interim transcription (partial, updating as user speaks)
          if (serverContent.interimInputTranscription?.text) {
            callbacks.onInterim(serverContent.interimInputTranscription.text);
          }

          // Handle final transcription (committed when speaker pauses)
          if (serverContent.inputTranscription?.text) {
            callbacks.onFinal(serverContent.inputTranscription.text);
            this.finalTranscriptPending = false;
          }

          // Handle model turn with text output
          if (serverContent.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              if (part.text) {
                callbacks.onFinal(part.text);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing Gemini response:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('Gemini WebSocket error:', event);
        callbacks.onError('WebSocket connection error. Check your API key and network.');
        clearTimeout(connectionTimeout);
        if (!this.setupComplete) {
          reject(new Error('WebSocket error'));
        }
      };

      this.ws.onclose = (event) => {
        console.log('Gemini WebSocket closed:', event.code, event.reason);
        const wasRunning = this.running;
        this.running = false;
        if (wasRunning) {
          callbacks.onDisconnected();
        }
      };
    });
  }

  sendAudio(chunk: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.running || !this.setupComplete) return;
    
    const base64PCM = float32ToBase64PCM(chunk);
    
    const message = {
      realtimeInput: {
        mediaChunks: [
          {
            data: base64PCM,
            mimeType: 'audio/pcm;rate=16000',
          },
        ],
      },
    };
    
    this.ws.send(JSON.stringify(message));
  }

  async stop(): Promise<void> {
    this.running = false;
    
    if (this.ws) {
      try {
        // Send stream end signal
        this.ws.send(JSON.stringify({
          realtimeInput: {
            audioStreamEnd: true,
          },
        }));
      } catch (e) {
        // Ignore errors during shutdown
      }
      
      // Give more time for final transcription to arrive
      setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }, 2000);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
