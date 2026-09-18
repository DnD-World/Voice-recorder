import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';
import { float32ToBase64PCM } from '../audioCapture';

/**
 * Voxtral Mini Transcribe Realtime provider
 * Uses WebSocket to stream audio and receive real-time transcriptions
 * Endpoint: wss://api.mistral.ai/v1/audio/realtime
 */
export class VoxtralRealtimeProvider implements TranscriptionProviderInterface {
  private ws: WebSocket | null = null;
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    
    if (!settings.mistralApiKey) {
      callbacks.onError('Mistral API key is required');
      return;
    }

    return new Promise((resolve, reject) => {
      // Mistral realtime WebSocket endpoint
      const wsUrl = 'wss://api.mistral.ai/v1/audio/realtime';
      
      this.ws = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.ws?.close();
      }, 10000);

      this.ws.onopen = () => {
        // Send session configuration
        const configMessage = {
          type: 'session.update',
          session: {
            model: 'voxtral-mini-transcribe-realtime-2602',
            input_audio_format: 'pcm_s16le',
            input_audio_sample_rate: 16000,
            input_audio_channels: 1,
            target_streaming_delay_ms: 500,
            language: settings.language ? settings.language.split('-')[0] : 'el',
          },
        };
        
        this.ws?.send(JSON.stringify(configMessage));
        this.running = true;
        
        setTimeout(() => {
          clearTimeout(connectionTimeout);
          callbacks.onConnected();
          resolve();
        }, 500);
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          switch (response.type) {
            case 'session.created':
              console.log('Voxtral session created');
              break;
              
            case 'transcription.delta':
              // Interim/partial transcription
              if (response.delta) {
                callbacks.onInterim(response.delta);
              }
              break;
              
            case 'transcription.text':
              // Final text for a segment
              if (response.text) {
                callbacks.onFinal(response.text);
              }
              break;
              
            case 'transcription.done':
              // Segment complete
              if (response.text) {
                callbacks.onFinal(response.text);
              }
              break;
              
            case 'error':
              callbacks.onError(response.error?.message || 'Unknown error');
              break;
              
            default:
              // Handle any other message types
              if (response.text) {
                callbacks.onFinal(response.text);
              }
              break;
          }
        } catch (e) {
          console.error('Error parsing Voxtral response:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('Voxtral WebSocket error:', event);
        callbacks.onError('WebSocket connection error. Check your Mistral API key.');
        clearTimeout(connectionTimeout);
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = (event) => {
        console.log('Voxtral WebSocket closed:', event.code, event.reason);
        this.running = false;
        callbacks.onDisconnected();
      };
    });
  }

  sendAudio(chunk: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.running) return;
    
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
        // Signal end of audio
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.commit',
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
