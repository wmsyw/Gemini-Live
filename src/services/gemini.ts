import { GeminiLiveConfig } from '@/types';
import { audioService } from './audio';

type MessageHandler = (data: unknown) => void;

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private onMessage: MessageHandler | null = null;
  private onError: ((error: Event) => void) | null = null;
  private onClose: ((event: CloseEvent) => void) | null = null;
  
  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }
  
  connect(onMessage: MessageHandler, onError?: (e: Event) => void, onClose?: (e: CloseEvent) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onMessage = onMessage;
      this.onError = onError || null;
      this.onClose = onClose || null;
      
      let url: string;
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isExplicitWS = this.config.baseUrl && (this.config.baseUrl.startsWith('ws://') || this.config.baseUrl.startsWith('wss://'));
      const wantsProxy = !!isExplicitWS || isLocal;
      if (wantsProxy) {
        url = isExplicitWS
          ? this.config.baseUrl
          : 'ws://localhost:8080/live';
      } else {
        const host = (this.config.baseUrl || 'https://generativelanguage.googleapis.com').replace(/^https?:\/\//, '');
        url = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;
      }
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('Connected to Gemini Live API');
        this.sendSetup();
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
            if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const json = JSON.parse(reader.result as string);
                        this.handleMessage(json);
                    } catch (e) {
                        console.error('Error parsing binary message', e);
                    }
                };
                reader.readAsText(event.data);
            } else {
                const response = JSON.parse(event.data);
                this.handleMessage(response);
            }
        } catch (e) {
            console.error('Error parsing message', e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error');
        if (this.onError) this.onError(error);
        // Only reject if it happens during connection phase
        if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        if (this.onClose) this.onClose(event);
      };
    });
  }
  
  private sendSetup() {
    const setupMessage = {
      setup: {
        model: this.config.model,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: this.config.voice?.voiceName || "Aoede"
              }
            }
          }
        }
      }
    };
    this.send(setupMessage);
  }
  
  sendAudioData(audioBuffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const base64Audio = this.arrayBufferToBase64(audioBuffer);
    const sampleRate = audioService.getSampleRate();
    
    const message = {
      realtime_input: {
        media_chunks: [{
          data: base64Audio,
          mime_type: `audio/pcm;rate=${sampleRate}`
        }]
      }
    };
    
    this.send(message);
  }
  
  sendText(text: string) {
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [{ text }]
          }
        ],
        turn_complete: true
      }
    };
    this.send(message);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  private send(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  private handleMessage(response: unknown) {
    if (this.onMessage) {
      this.onMessage(response);
    }
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
