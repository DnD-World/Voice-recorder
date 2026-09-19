import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';
import { float32ToBase64PCM } from '../audioCapture';

/**
 * Voxtral Mini Transcribe Realtime provider
 * Uses WebSocket to stream audio and receive real-time transcriptions
 * 
 * NOTE: Browser WebSocket API cannot set custom headers, so we pass
 * the API key as a query parameter. This is acceptable for private
 * Tailscale networks but should be proxied for public deployments.
 */
export class VoxtralRealtimeProvider implements TranscriptionProviderInterface {
  private ws: WebSocket | null = null;
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;
  private setupComplete = false;

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.setupComplete = false;
    
    if (!settings.mistralApiKey) {
      callbacks.onError('Mistral API key is required');
      return;
    }

    return new Promise((resolve, reject) => {
      // Pass API key as query parameter (browser WebSocket limitation)
      const wsUrl = `wss://api.mistral.ai/v1/audio/realtime?apiKey=${encodeURIComponent(settings.mistralApiKey)}`;
      
      this.ws = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        if (!this.setupComplete) {
          reject(new Error('Connection timeout'));
          this.ws?.close();
        }
      }, 15000);

      this.ws.onopen = () => {
        // Send session configuration
        const configMessage = {
          type: 'session.update',
          session: {
            model: 'voxtral-mini-transcribe-2507',
            input_audio_format: 'pcm_s16le',
            language: settings.language ? settings.language.split('-')[0] : 'el',
          },
        };
        
        this.ws?.send(JSON.stringify(configMessage));
        this.running = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          switch (response.type) {
            case 'session.created':
              console.log('Voxtral session created');
              break;
              
            case 'session.updated':
              console.log('Voxtral session updated - ready');
              this.setupComplete = true;
              clearTimeout(connectionTimeout);
              callbacks.onConnected();
              resolve();
              break;
              
            case 'conversation.item.input_audio_transcription.delta':
              // Interim/partial transcription
              if (response.delta) {
                callbacks.onInterim(response.delta);
              }
              break;
              
            case 'conversation.item.input_audio_transcription.completed':
              // Final text for a segment
              if (response.transcript) {
                callbacks.onFinal(response.transcript);
              }
              break;
              
            case 'error':
              callbacks.onError(response.error?.message || 'Unknown error from Voxtral');
              clearTimeout(connectionTimeout);
              reject(new Error(response.error?.message || 'Voxtral error'));
              break;
              
            default:
              // Handle transcript in other message types
              if (response.transcript) {
                callbacks.onFinal(response.transcript);
              }
              break;
          }
        } catch (e) {
          console.error('Error parsing Voxtral response:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('Voxtral WebSocket error:', event);
        callbacks.onError('WebSocket connection error. Check your Mistral API key and network.');
        clearTimeout(connectionTimeout);
        if (!this.setupComplete) {
          reject(new Error('WebSocket error'));
        }
      };

      this.ws.onclose = (event) => {
        console.log('Voxtral WebSocket closed:', event.code, event.reason);
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
    
    // Voxtral expects raw PCM bytes as base64
    const base64PCM = float32ToBase64PCM(chunk);
    
    const message = {
      type: 'input_audio_buffer.append',
      audio: base64PCM,
    };
    
    this.ws.send(JSON.stringify(message));
  }

  async stop(): Promise<void> {
    this.running = false;
    
    if (this.ws) {
      try {
        // Signal end of audio and wait for final transcription
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.commit',
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
