import { create } from 'zustand';
import { AppState, AppSettings, LiveMessage } from '@/types';
import { storageService } from '@/services/storage';
import { GeminiLiveClient } from '@/services/gemini';

interface StoreState extends Omit<AppState, 'audioContext' | 'mediaStream' | 'audioVisualizer'> {
  // Actions
  setConnected: (connected: boolean) => void;
  setRecording: (recording: boolean) => void;
  setPlaying: (playing: boolean) => void;
  addMessage: (message: LiveMessage) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  loadHistory: () => Promise<void>;
  startSession: () => void;
  endSession: () => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  deleteHistories: (ids: string[]) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  renameHistory: (id: string, summary: string) => Promise<void>;
  
  // Clients
  geminiClient: GeminiLiveClient | null;
  initializeGeminiClient: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com',
  forceProxy: false,
  theme: 'auto',
  language: 'zh-CN',
  voiceStyle: 'Aoede',
  audioSettings: {
    inputGain: 1.0,
    outputGain: 1.0,
    noiseSuppression: true,
    echoCancellation: true
  },
  systemInstruction: '',
  useGlobalVoiceConstraints: false
};

export const useStore = create<StoreState>((set, get) => ({
  isConnected: false,
  isRecording: false,
  isPlaying: false,
  currentTheme: 'light',
  currentLanguage: 'zh-CN',
  currentConversation: {
    id: '',
    startTime: 0,
    messages: []
  },
  conversationHistory: [],
  settings: DEFAULT_SETTINGS,
  geminiClient: null,
  
  setConnected: (connected) => set({ isConnected: connected }),
  setRecording: (recording) => set({ isRecording: recording }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  addMessage: (message) => set((state) => ({
    currentConversation: {
      ...state.currentConversation,
      messages: [...state.currentConversation.messages, message]
    }
  })),
  
  updateSettings: async (newSettings) => {
    const currentSettings = get().settings;
    const updated = { ...currentSettings, ...newSettings };
    set({ 
      settings: updated,
      ...(newSettings.theme ? { currentTheme: updated.theme } : {}),
      ...(newSettings.language ? { currentLanguage: updated.language } : {})
    });
    await storageService.saveSettings(updated);
    
    // Re-initialize client if API key changes
    if (newSettings.apiKey && newSettings.apiKey !== currentSettings.apiKey) {
        get().initializeGeminiClient();
    }
    // Re-initialize client if voice style changes
    if (newSettings.voiceStyle && newSettings.voiceStyle !== currentSettings.voiceStyle) {
        get().initializeGeminiClient();
    }
    // Re-initialize client if system instruction changes
    if (typeof newSettings.systemInstruction === 'string' && newSettings.systemInstruction !== currentSettings.systemInstruction) {
        get().initializeGeminiClient();
    }
    // Re-initialize client if global constraints toggle changes
    if (typeof newSettings.useGlobalVoiceConstraints === 'boolean' && newSettings.useGlobalVoiceConstraints !== currentSettings.useGlobalVoiceConstraints) {
        get().initializeGeminiClient();
    }
  },
  
  loadSettings: async () => {
    const settings = await storageService.getSettings();
    if (settings) {
      const merged = { ...DEFAULT_SETTINGS, ...settings };
      set({ 
        settings: merged,
        currentTheme: merged.theme,
        currentLanguage: merged.language
      });
      // Initialize client if API key exists
      if (merged.apiKey) {
          get().initializeGeminiClient();
      }
    }
  },
  
  loadHistory: async () => {
    const history = await storageService.getHistory();
    set({ conversationHistory: history.reverse() }); // Newest first
  },
  
  deleteHistory: async (id: string) => {
    await storageService.deleteHistory(id);
    await get().loadHistory();
  },
  
  deleteHistories: async (ids: string[]) => {
    await storageService.deleteHistories(ids);
    await get().loadHistory();
  },
  
  clearAllHistory: async () => {
    await storageService.clearHistory();
    await get().loadHistory();
  },

  renameHistory: async (id: string, summary: string) => {
    await storageService.renameHistory(id, summary);
    await get().loadHistory();
  },
  
  startSession: () => {
    const id = Date.now().toString();
    set({
      currentConversation: {
        id,
        startTime: Date.now(),
        messages: []
      }
    });
  },
  
  endSession: async () => {
    const { currentConversation } = get();
    if (currentConversation.messages.length > 0) {
      const historyItem = {
        ...currentConversation,
        timestamp: currentConversation.startTime,
        duration: Date.now() - currentConversation.startTime,
        summary: `新对话`,
      };
      await storageService.saveHistory(historyItem);
      await get().loadHistory();
    }
  },
  
  initializeGeminiClient: () => {
      const { settings } = get();
      if (!settings.apiKey) return;
      
      const client = new GeminiLiveClient({
          model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          forceProxy: settings.forceProxy,
          voice: {
              language: settings.language,
              speed: 1.0,
              pitch: 1.0,
              voiceName: settings.voiceStyle
          },
          systemInstruction: settings.systemInstruction,
          useGlobalVoiceConstraints: settings.useGlobalVoiceConstraints
      });
      
      set({ geminiClient: client });
  }
}));
