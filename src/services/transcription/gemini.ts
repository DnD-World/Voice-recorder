import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';
import { float32ToBase64PCM } from '../audioCapture';

/**
 * Gemini 3.5 Transcribe Live provider
 * Uses WebSocket to stream audio and receive real-time transcriptions
 */
export class GeminiTranscribeProvider implements TranscriptionProviderInterface {
  private ws: WebSocket | null = null;
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    
    if (!settings.geminiApiKey) {
      callbacks.onError('Gemini API key is required');
      return;
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${settings.geminiApiKey}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.ws?.close();
      }, 10000);

      this.ws.onopen = () => {
        // Send setup message
        const setupMessage = {
          setup: {
            model: 'models/gemini-3.5-transcribe-live',
            generationConfig: {
              responseModalities: ['TEXT'],
            },
            inputAudioTranscription: {
              languageCodes: settings.language ? [settings.language] : [],
              ...(settings.smartTranscription ? { mode: 'SMART' } : {}),
            },
          },
        };
        
        this.ws?.send(JSON.stringify(setupMessage));
        this.running = true;
        
        // Give a brief moment for setup to be acknowledged
        setTimeout(() => {
          clearTimeout(connectionTimeout);
          callbacks.onConnected();
          resolve();
        }, 500);
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          // Handle setup complete
          if (response.setupComplete) {
            console.log('Gemini setup complete');
            return;
          }
          
          const content = response.serverContent;
          if (!content) return;

          // Interim transcription (partial, updating as user speaks)
          if (content.interimInputTranscription) {
            callbacks.onInterim(content.interimInputTranscription.text);
          }

          // Final transcription (committed when speaker pauses)
          if (content.inputTranscription) {
            callbacks.onFinal(content.inputTranscription.text);
          }
        } catch (e) {
          console.error('Error parsing Gemini response:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('Gemini WebSocket error:', event);
        callbacks.onError('WebSocket connection error. Check your API key.');
        clearTimeout(connectionTimeout);
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = (event) => {
        console.log('Gemini WebSocket closed:', event.code, event.reason);
        this.running = false;
        callbacks.onDisconnected();
      };
    });
  }

  sendAudio(chunk: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.running) return;
    
    const base64PCM = float32ToBase64PCM(chunk);
    
    const message = {
      realtimeInput: {
        audio: {
          data: base64PCM,
          mimeType: 'audio/pcm;rate=16000',
        },
      },
    };
    
    this.ws.send(JSON.stringify(message));
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.ws) {
      // Send stream end signal
      try {
        this.ws.send(JSON.stringify({
          realtimeInput: {
            audioStreamEnd: true,
          },
        }));
      } catch (e) {
        // Ignore errors during shutdown
      }
      
      setTimeout(() => {
        this.ws?.close();
        this.ws = null;
      }, 500);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
