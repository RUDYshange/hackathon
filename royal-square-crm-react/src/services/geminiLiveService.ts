/**
 * Royal Square CRM — Gemini 3.5 Transcribe Live Audio & STT Service
 * 
 * Implements real-time bidirectional streaming over WebSockets to Google's
 * `gemini-3.5-transcribe-live` model combined with instant browser speech
 * recognition to guarantee 0ms latency visual feedback for form filling.
 */

export interface LiveTranscribeCallbacks {
  onDelta?: (deltaText: string) => void;
  onTranscript?: (fullTranscript: string) => void;
  onVolumeChange?: (volume: number) => void; // 0.0 to 1.0
  onStatusChange?: (status: 'idle' | 'connecting' | 'listening' | 'processing' | 'stopped' | 'error') => void;
  onError?: (errorMessage: string) => void;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private transcript: string = '';
  private isListening: boolean = false;
  private recognition: any = null;

  // Retrieve API key from localStorage or Vite environment variable
  public static getApiKey(): string {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored && stored.trim() !== '') return stored.trim();
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  public static setApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem('GEMINI_API_KEY', key.trim());
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
  }

  /**
   * Start live speech-to-text recording and streaming
   */
  public async start(callbacks: LiveTranscribeCallbacks): Promise<void> {
    if (this.isListening) {
      await this.stop();
    }

    this.transcript = '';
    this.isListening = true;
    callbacks.onStatusChange?.('listening');

    // 1. Start Instant Local Speech Recognition
    // This guarantees the user immediately SEES every word they say with zero latency
    this.startLiveSpeechRecognition(callbacks);

    // 2. Initialize Microphone Stream for Audio Visualizer & Gemini Live WebSocket
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.setupAudioMeter(callbacks);

      const apiKey = GeminiLiveService.getApiKey();
      if (apiKey) {
        this.connectGeminiWebSocket(apiKey, callbacks);
      }
    } catch (err: any) {
      console.warn('[GeminiLive] Mic stream notice:', err);
    }
  }

  /**
   * High-responsiveness continuous browser speech recognition
   */
  private startLiveSpeechRecognition(callbacks: LiveTranscribeCallbacks) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[GeminiLive] Web Speech API not supported in this environment.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      this.recognition = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-ZA'; // South African English

      let finalSoFar = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalSoFar += (finalSoFar ? ' ' : '') + res[0].transcript.trim();
          } else {
            interim += res[0].transcript;
          }
        }

        const combined = (finalSoFar + (interim ? ' ' + interim : '')).trim();
        if (combined) {
          this.transcript = combined;
          callbacks.onDelta?.(interim || combined);
          callbacks.onTranscript?.(combined);
          // Modulate volume indicator when speech is detected
          callbacks.onVolumeChange?.(0.75);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[GeminiLive] SpeechRecognition event:', event.error);
        }
      };

      recognition.onend = () => {
        if (this.isListening) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
    } catch (e) {
      console.error('[GeminiLive] Failed starting recognition:', e);
    }
  }

  /**
   * Connects to Google Gemini 3.5 Transcribe Live WebSocket
   */
  private connectGeminiWebSocket(apiKey: string, callbacks: LiveTranscribeCallbacks) {
    try {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[GeminiLive] WebSocket connected to Gemini 3.5 Transcribe Live.');
        const setupPayload = {
          setup: {
            model: 'models/gemini-3.5-transcribe-live',
            generationConfig: {
              responseModalities: ['TEXT']
            }
          }
        };
        this.ws?.send(JSON.stringify(setupPayload));
      };

      this.ws.onmessage = async (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : await event.data.text();
          const message = JSON.parse(raw);

          if (message.setupComplete) {
            console.log('[GeminiLive] Setup confirmed. Ready.');
            return;
          }

          // Extract text from any Gemini transcribe output format
          let textPiece = '';

          // 1. Check inputTranscription (finalized text)
          if (message.serverContent?.inputTranscription?.text) {
            textPiece = message.serverContent.inputTranscription.text;
          }
          // 2. Check interimInputTranscription (real-time stream)
          else if (message.serverContent?.interimInputTranscription?.text) {
            textPiece = message.serverContent.interimInputTranscription.text;
          }
          // 3. Check modelTurn parts
          else if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.text) textPiece += part.text;
            }
          }
          // 4. Check root interim or text
          else if (message.interimInputTranscription?.text) {
            textPiece = message.interimInputTranscription.text;
          } else if (message.text) {
            textPiece = message.text;
          }

          if (textPiece) {
            // Only update if longer or more accurate than local recognition
            if (textPiece.length >= this.transcript.length) {
              this.transcript = textPiece.trim();
              callbacks.onTranscript?.(this.transcript);
            }
          }
        } catch (e) {
          console.error('[GeminiLive] WS message parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[GeminiLive] WS error:', err);
      };
    } catch (e) {
      console.warn('[GeminiLive] WS connection error:', e);
    }
  }

  /**
   * Sets up AudioContext for volume visualization and PCM streaming
   */
  private setupAudioMeter(callbacks: LiveTranscribeCallbacks) {
    if (!this.mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isListening) return;

        const inputBuffer = event.inputBuffer.getChannelData(0);

        // Calculate RMS Volume for animated equalizer
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        const normalizedVolume = Math.min(1.0, rms * 5.5);
        callbacks.onVolumeChange?.(normalizedVolume);

        // Stream PCM to WebSocket if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const sampleRate = this.audioContext?.sampleRate || 44100;
          const pcm16 = this.downsampleTo16kPCM(inputBuffer, sampleRate);
          const base64Data = this.arrayBufferToBase64(pcm16.buffer);

          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }]
            }
          }));
        }
      };

      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('[GeminiLive] AudioContext error:', e);
    }
  }

  private downsampleTo16kPCM(input: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
      const output = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return output;
    }

    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / ratio);
    const output = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = Math.round(i * ratio);
      const s = Math.max(-1, Math.min(1, input[originalIndex] || 0));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Stop active recording and cleanup audio/socket resources
   */
  public async stop(): Promise<string> {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close(1000, 'User stopped dictation');
        }
      } catch (_) {}
      this.ws = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    return this.transcript.trim();
  }
}

export const liveTranscribeService = new GeminiLiveService();
