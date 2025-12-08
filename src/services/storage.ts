import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppSettings, ConversationHistory } from '@/types';

interface GeminiDB extends DBSchema {
  settings: {
    key: string;
    value: AppSettings;
  };
  history: {
    key: string;
    value: ConversationHistory;
    indexes: { 'by-timestamp': number };
  };
}

export class StorageService {
  private dbPromise: Promise<IDBPDatabase<GeminiDB>>;

  constructor() {
    this.dbPromise = openDB<GeminiDB>('gemini-voice-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  async getSettings(): Promise<AppSettings | undefined> {
    const db = await this.dbPromise;
    return db.get('settings', 'app-settings');
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.dbPromise;
    await db.put('settings', settings, 'app-settings');
  }

  async saveHistory(history: ConversationHistory): Promise<void> {
    const db = await this.dbPromise;
    await db.put('history', history);
  }

  async getHistory(): Promise<ConversationHistory[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('history', 'by-timestamp');
  }
  
  async getHistoryById(id: string): Promise<ConversationHistory | undefined> {
      const db = await this.dbPromise;
      return db.get('history', id);
  }
  
  async clearHistory(): Promise<void> {
      const db = await this.dbPromise;
      await db.clear('history');
  }

  async deleteHistory(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('history', id);
  }

  async deleteHistories(ids: string[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('history', 'readwrite');
    for (const id of ids) {
      await tx.store.delete(id);
    }
    await tx.done;
  }

  async renameHistory(id: string, summary: string): Promise<void> {
    const db = await this.dbPromise;
    const item = await db.get('history', id);
    if (!item) return;
    const updated = { ...item, summary };
    await db.put('history', updated);
  }
}

export const storageService = new StorageService();
