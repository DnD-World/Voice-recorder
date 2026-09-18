/**
 * Audio capture utility - captures microphone audio as PCM 16kHz 16-bit mono
 */

export class AudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private onAudioChunk: ((chunk: Float32Array) => void) | null = null;
  private isRunning = false;

  async start(onChunk: (chunk: Float32Array) => void): Promise<void> {
    this.onAudioChunk = onChunk;
    
    // Get microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Create audio context with desired sample rate
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    // Create source from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Use ScriptProcessorNode for raw PCM access (deprecated but widely supported)
    // Buffer size 4096 gives us ~256ms chunks at 16kHz
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.isRunning) return;
      const inputData = event.inputBuffer.getChannelData(0);
      // Copy the data to avoid buffer reuse issues
      const chunk = new Float32Array(inputData.length);
      chunk.set(inputData);
      this.onAudioChunk?.(chunk);
    };

    // Connect the nodes
    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
    
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.onAudioChunk = null;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Convert Float32Array PCM to 16-bit PCM ArrayBuffer
 */
export function float32To16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit signed integer
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Float32Array to base64-encoded 16-bit PCM
 */
export function float32ToBase64PCM(float32Array: Float32Array): string {
  const pcm16 = float32To16BitPCM(float32Array);
  return arrayBufferToBase64(pcm16);
}
