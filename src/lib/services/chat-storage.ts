// ============================================
// Chat Storage Service using IndexedDB
// Persistent storage for chat sessions and messages
// ============================================

import { InteractiveCourseSession, ConversationMessage } from '@/types/interactive-course';

interface ChatMessage {
  id: string;
  role: 'genie' | 'learner';
  content: string;
  timestamp: Date;
  type?: 'message' | 'assessment' | 'challenge' | 'quiz' | 'challenge_trigger';
  assessmentData?: any;
  quizData?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    answered?: string;
    isCorrect?: boolean;
  };
  challengeData?: {
    challengeId: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'pending' | 'started' | 'completed' | 'failed';
  };
}

interface StoredSession {
  id: string;
  courseId: string;
  userId: string;
  session: InteractiveCourseSession;
  messages: ChatMessage[];
  lastUpdated: Date;
}

class ChatStorageService {
  private dbName = 'GenieChat';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('courseId', 'courseId', { unique: false });
          sessionsStore.createIndex('userId', 'userId', { unique: false });
          sessionsStore.createIndex('userCourse', ['userId', 'courseId'], { unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save a chat session
   */
  async saveSession(session: InteractiveCourseSession, messages: ChatMessage[]): Promise<void> {
    if (!this.db) await this.init();

    const storedSession: StoredSession = {
      id: session.id,
      courseId: session.courseId,
      userId: session.userId,
      session,
      messages,
      lastUpdated: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(storedSession);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load a chat session
   */
  async loadSession(userId: string, courseId: string): Promise<StoredSession | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('userCourse');
      const request = index.get([userId, courseId]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.session.sessionStartTime = new Date(result.session.sessionStartTime);
          result.session.lastInteraction = new Date(result.session.lastInteraction);
          result.session.createdAt = new Date(result.session.createdAt);
          result.session.updatedAt = new Date(result.session.updatedAt);
          result.lastUpdated = new Date(result.lastUpdated);

          result.messages = result.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
        resolve(result || null);
      };
    });
  }

  /**
   * Add a message to a session
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    if (!this.db) await this.init();

    // First, get the current session
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add message to the session
    session.messages.push(message);
    session.lastUpdated = new Date();

    // Update session in storage
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<StoredSession | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.session.sessionStartTime = new Date(result.session.sessionStartTime);
          result.session.lastInteraction = new Date(result.session.lastInteraction);
          result.session.createdAt = new Date(result.session.createdAt);
          result.session.updatedAt = new Date(result.session.updatedAt);
          result.lastUpdated = new Date(result.lastUpdated);

          result.messages = result.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
        resolve(result || null);
      };
    });
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<InteractiveCourseSession>): Promise<void> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session properties
    Object.assign(session.session, updates);
    session.session.updatedAt = new Date();
    session.lastUpdated = new Date();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<StoredSession[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((session: any) => {
          // Convert date strings back to Date objects
          session.session.sessionStartTime = new Date(session.session.sessionStartTime);
          session.session.lastInteraction = new Date(session.session.lastInteraction);
          session.session.createdAt = new Date(session.session.createdAt);
          session.session.updatedAt = new Date(session.session.updatedAt);
          session.lastUpdated = new Date(session.lastUpdated);

          session.messages = session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));

          return session;
        });
        resolve(results);
      };
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all data (for debugging)
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instance
export const chatStorage = new ChatStorageService();
export type { ChatMessage, StoredSession };