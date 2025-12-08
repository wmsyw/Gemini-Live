export interface GeminiLiveConfig {
  model: string;
  apiKey: string;
  baseUrl?: string;
  forceProxy?: boolean;
  voice?: {
    language: string;
    speed: number;
    pitch: number;
    voiceName?: 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Kore';
  };
}

export interface AudioFormat {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  encoding: 'pcm' | 'wav';
}

export interface LiveMessage {
  type: 'input' | 'output' | 'tool' | 'error';
  timestamp: number;
  role?: 'user' | 'model' | 'system';
  data: {
    audio?: ArrayBuffer; // Changed to match actual usage, might be base64 string in some contexts but ArrayBuffer for internal handling
    text?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ConversationHistory {
  id: string;
  timestamp: number;
  duration: number;
  messages: LiveMessage[];
  summary: string;
}

export interface AppSettings {
  apiKey: string;
  baseUrl: string;
  forceProxy: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  voiceStyle?: 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Kore';
  audioSettings: {
    inputGain: number;
    outputGain: number;
    noiseSuppression: boolean;
    echoCancellation: boolean;
  };
}

export interface ConversationSession {
  id: string;
  startTime: number;
  endTime?: number;
  messages: LiveMessage[];
}

export interface AppState {
  isConnected: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  currentTheme: 'light' | 'dark' | 'auto';
  currentLanguage: string;
  currentConversation: ConversationSession;
  conversationHistory: ConversationHistory[];
  settings: AppSettings;
  
  audioContext?: AudioContext | null;
  mediaStream?: MediaStream | null;
  audioVisualizer?: AnalyserNode | null;
}

export interface InlineDataPart {
  inlineData: {
    data: string;
    mimeType?: string;
  };
}

export interface TextPart {
  text: string;
}

export type ModelPart = InlineDataPart | TextPart;

export interface ServerMessage {
  serverContent?: {
    modelTurn?: {
      parts: ModelPart[];
    };
  };
}
