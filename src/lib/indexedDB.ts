const DB_NAME = 'EdBoxDB';
const DB_VERSION = 1;

export interface UserData {
  id: string;
  key: string;
  value: any;
  timestamp: number;
  expiresAt?: number;
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('userData')) {
          const userDataStore = db.createObjectStore('userData', { keyPath: 'key' });
          userDataStore.createIndex('userId', 'id', { unique: false });
          userDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('courses')) {
          const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
          coursesStore.createIndex('userId', 'userId', { unique: false });
          coursesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('userId', 'userId', { unique: false });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('studySets')) {
          const studySetsStore = db.createObjectStore('studySets', { keyPath: 'id' });
          studySetsStore.createIndex('userId', 'userId', { unique: false });
          studySetsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('skillGraphs')) {
          const skillGraphsStore = db.createObjectStore('skillGraphs', { keyPath: 'id' });
          skillGraphsStore.createIndex('userId', 'userId', { unique: false });
          skillGraphsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('circles')) {
          const circlesStore = db.createObjectStore('circles', { keyPath: 'id' });
          circlesStore.createIndex('userId', 'userId', { unique: false });
          circlesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        console.log('[IndexedDB] Database schema created');
      };
    });
  }

  async set(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({
        ...data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiresAt && result.expiresAt < Date.now()) {
          this.delete(storeName, key);
          resolve(null);
        } else {
          resolve(result || null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string, indexName?: string, indexValue?: any): Promise<T[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      if (indexName && indexValue !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = request.result || [];
        const validResults = results.filter((item: any) => {
          if (item.expiresAt && item.expiresAt < Date.now()) {
            this.delete(storeName, item.key || item.id);
            return false;
          }
          return true;
        });
        resolve(validResults);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpired(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const storeNames = ['userData', 'courses', 'notes', 'studySets', 'skillGraphs', 'circles'];
    const now = Date.now();

    for (const storeName of storeNames) {
      const items = await this.getAll<any>(storeName);
      for (const item of items) {
        if (item.expiresAt && item.expiresAt < now) {
          await this.delete(storeName, item.key || item.id);
        }
      }
    }
  }

  async saveCourse(course: any, userId: string): Promise<void> {
    await this.set('courses', {
      ...course,
      userId,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
  }

  async getCourses(userId: string): Promise<any[]> {
    return this.getAll('courses', 'userId', userId);
  }

  async saveNote(note: any, userId: string): Promise<void> {
    await this.set('notes', {
      ...note,
      userId,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });
  }

  async getNotes(userId: string): Promise<any[]> {
    return this.getAll('notes', 'userId', userId);
  }

  async saveStudySet(studySet: any, userId: string): Promise<void> {
    await this.set('studySets', {
      ...studySet,
      userId,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });
  }

  async getStudySets(userId: string): Promise<any[]> {
    return this.getAll('studySets', 'userId', userId);
  }

  async saveSkillGraph(skillGraph: any, userId: string): Promise<void> {
    await this.set('skillGraphs', {
      ...skillGraph,
      userId,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
  }

  async getSkillGraphs(userId: string): Promise<any[]> {
    return this.getAll('skillGraphs', 'userId', userId);
  }

  async saveCircle(circle: any, userId: string): Promise<void> {
    await this.set('circles', {
      ...circle,
      userId,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
  }

  async getCircles(userId: string): Promise<any[]> {
    return this.getAll('circles', 'userId', userId);
  }

  async saveUserData(key: string, value: any, userId: string, expiresInMs?: number): Promise<void> {
    await this.set('userData', {
      id: userId,
      key,
      value,
      timestamp: Date.now(),
      expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined
    });
  }

  async getUserData(key: string): Promise<any> {
    const data = await this.get<UserData>('userData', key);
    return data?.value || null;
  }
}

export const db = new IndexedDBManager();

if (typeof window !== 'undefined') {
  db.init().catch(console.error);
  
  setInterval(() => {
    db.clearExpired().catch(console.error);
  }, 60 * 60 * 1000);
}
