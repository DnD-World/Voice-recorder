import { AppSettings } from '../../types';
import { TranscriptionCallbacks, TranscriptionProviderInterface } from './types';

/**
 * Browser Speech Recognition provider
 * Uses the Web Speech API (built into Chrome, Edge, Safari)
 * No API key needed, but quality varies for Greek
 */
export class BrowserSpeechProvider implements TranscriptionProviderInterface {
  private recognition: any = null;
  private running = false;
  private callbacks: TranscriptionCallbacks | null = null;

  async start(settings: AppSettings, callbacks: TranscriptionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      callbacks.onError('Speech Recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = settings.language || 'el-GR';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.running = true;
      callbacks.onConnected();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        callbacks.onInterim(interimTranscript);
      }
      
      if (finalTranscript) {
        callbacks.onFinal(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Browser speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        callbacks.onError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        // Don't treat no-speech as an error, just restart
        if (this.running) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started
          }
        }
      } else {
        callbacks.onError(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be running
      if (this.running) {
        try {
          this.recognition.start();
        } catch (e) {
          this.running = false;
          callbacks.onDisconnected();
        }
      } else {
        callbacks.onDisconnected();
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      callbacks.onError('Failed to start speech recognition');
    }
  }

  sendAudio(_chunk: Float32Array): void {
    // Browser Speech API handles audio internally, no need to send chunks
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors during shutdown
      }
      this.recognition = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
