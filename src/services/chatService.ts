import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { Conversation, Message, RelationshipTopic, Language } from '../types';

// Helper to safely strip undefined values so Firestore never throws
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export const chatService = {
  // Listen to user conversations with local persistence cache
  subscribeConversations(userId: string, callback: (convs: Conversation[]) => void) {
    const cacheKey = `intima_convs_${userId}`;
    // Immediately emit cached conversations if available
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          callback(cached);
        }
      }
    } catch {
      // ignore
    }

    const colRef = collection(db, 'conversations');
    const q = query(
      colRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const convs: Conversation[] = [];
        snapshot.forEach((doc) => {
          convs.push(doc.data() as Conversation);
        });
        try {
          localStorage.setItem(cacheKey, JSON.stringify(convs));
        } catch {
          // ignore
        }
        callback(convs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'conversations');
        // Do not empty state if we have local cache
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            callback(JSON.parse(raw));
            return;
          }
        } catch {
          // ignore
        }
      }
    );
  },

  // Listen to messages of a conversation with strict chronological ordering & instant local cache
  subscribeMessages(conversationId: string, callback: (msgs: Message[]) => void) {
    const cacheKey = `intima_msgs_${conversationId}`;
    // Immediately emit cached messages so the UI has zero delay and never flashes blank
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          callback(cached);
        }
      }
    } catch {
      // ignore
    }

    const colRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(colRef, orderBy('createdAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push(doc.data() as Message);
        });
        // Strict chronological sort
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        try {
          localStorage.setItem(cacheKey, JSON.stringify(msgs));
        } catch {
          // ignore
        }
        callback(msgs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`);
        // CRITICAL: NEVER call callback([]) on error! That caused messages to disappear!
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const cached = JSON.parse(raw);
            if (Array.isArray(cached) && cached.length > 0) {
              callback(cached);
            }
          }
        } catch {
          // ignore
        }
      }
    );
  },

  // Create a new conversation
  async createConversation(userId: string, title: string, topic: RelationshipTopic = 'general'): Promise<Conversation> {
    const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newConv: Conversation = {
      id: convId,
      userId,
      title,
      topic,
      messageCount: 0,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally immediately
    try {
      const cacheKey = `intima_convs_${userId}`;
      const raw = localStorage.getItem(cacheKey);
      const list: Conversation[] = raw ? JSON.parse(raw) : [];
      list.unshift(newConv);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, 'conversations', convId), cleanFirestoreData(newConv));
      return newConv;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${convId}`);
      return newConv;
    }
  },

  // Save message to subcollection with sanitized payload and offline safety
  async saveMessage(msg: Message): Promise<void> {
    const cacheKey = `intima_msgs_${msg.conversationId}`;

    // 1. Immediately store in local storage to prevent any data loss
    try {
      const raw = localStorage.getItem(cacheKey);
      const list: Message[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((m) => m.id === msg.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...msg };
      } else {
        list.push(msg);
      }
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 2. Persist to Firestore
    try {
      const sanitized = cleanFirestoreData(msg);
      const msgRef = doc(db, 'conversations', msg.conversationId, 'messages', msg.id);
      await setDoc(msgRef, sanitized);

      // Update parent conversation snippet & timestamp
      const convRef = doc(db, 'conversations', msg.conversationId);
      await updateDoc(convRef, {
        lastMessageSnippet: msg.content.substring(0, 120),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${msg.conversationId}/messages/${msg.id}`);
      throw err;
    }
  },

  // Update reactions and feedback
  async updateReaction(conversationId: string, messageId: string, liked: boolean, disliked: boolean) {
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(msgRef, { liked, disliked });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  },

  // Save granular feedback (dislike reason, report flag)
  async updateFeedback(
    conversationId: string,
    messageId: string,
    data: {
      liked?: boolean;
      disliked?: boolean;
      dislikeReason?: string;
      reported?: boolean;
      reportReason?: string;
    }
  ) {
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(msgRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  },

  // Delete a single message from conversation
  async deleteMessage(conversationId: string, messageId: string) {
    try {
      await deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `conversations/${conversationId}/messages/${messageId}`);
    }
  },

  // Delete conversation and clean up
  async deleteConversation(conversationId: string) {
    try {
      await deleteDoc(doc(db, 'conversations', conversationId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `conversations/${conversationId}`);
    }
  },

  // Pin / Unpin conversation
  async togglePin(conversationId: string, currentPinStatus: boolean) {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        pinned: !currentPinStatus,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`);
    }
  },

  // Export all conversations & messages for backup before cleanup
  async exportAllConversations(userId?: string): Promise<{
    timestamp: string;
    userId?: string;
    conversations: { conversation: Conversation; messages: Message[] }[];
  }> {
    const backup: {
      timestamp: string;
      userId?: string;
      conversations: { conversation: Conversation; messages: Message[] }[];
    } = {
      timestamp: new Date().toISOString(),
      userId,
      conversations: [],
    };

    try {
      // 1. Collect from Firestore if user is logged in
      if (userId) {
        const convsQuery = query(collection(db, 'conversations'), where('userId', '==', userId));
        const convsSnap = await getDocs(convsQuery).catch(() => null);
        if (convsSnap && !convsSnap.empty) {
          for (const convDoc of convsSnap.docs) {
            const conv = convDoc.data() as Conversation;
            const msgsQuery = query(collection(db, 'conversations', conv.id, 'messages'));
            const msgsSnap = await getDocs(msgsQuery).catch(() => null);
            const messages: Message[] = [];
            if (msgsSnap) {
              msgsSnap.forEach((m: any) => messages.push(m.data() as Message));
            }
            backup.conversations.push({ conversation: conv, messages });
          }
        }
      }

      // 2. Also check local storage (guest or offline conversations)
      if (typeof window !== 'undefined') {
        const guestConvsRaw = localStorage.getItem('intima_convs_guest');
        if (guestConvsRaw) {
          try {
            const guestList: Conversation[] = JSON.parse(guestConvsRaw);
            for (const conv of guestList) {
              if (!backup.conversations.some((b) => b.conversation.id === conv.id)) {
                const msgsRaw = localStorage.getItem(`intima_msgs_${conv.id}`);
                const messages: Message[] = msgsRaw ? JSON.parse(msgsRaw) : [];
                backup.conversations.push({ conversation: conv, messages });
              }
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('Backup export note:', e);
    }

    return backup;
  },

  // Complete cleanup of test conversations, messages, caches and server metrics
  async cleanupAllTestData(userId?: string): Promise<{
    success: boolean;
    deletedConversationsCount: number;
    deletedMessagesCount: number;
    backupData: any;
  }> {
    // 1. Perform automated backup first
    const backupData = await this.exportAllConversations(userId);
    let deletedConversationsCount = 0;
    let deletedMessagesCount = 0;

    // Trigger immediate browser download of backup JSON so user retains full security
    if (typeof window !== 'undefined' && backupData.conversations.length > 0) {
      try {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intima_backup_test_data_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }

    // 2. Delete conversations and messages in Firestore
    if (userId) {
      try {
        const convsQuery = query(collection(db, 'conversations'), where('userId', '==', userId));
        const convsSnap = await getDocs(convsQuery).catch(() => null);
        if (convsSnap && !convsSnap.empty) {
          for (const convDoc of convsSnap.docs) {
            const convId = convDoc.id;
            try {
              const msgsQuery = query(collection(db, 'conversations', convId, 'messages'));
              const msgsSnap = await getDocs(msgsQuery).catch(() => null);
              if (msgsSnap && !msgsSnap.empty) {
                for (const msgDoc of msgsSnap.docs) {
                  await deleteDoc(msgDoc.ref);
                  deletedMessagesCount++;
                }
              }
            } catch (err) {
              console.warn('Error deleting submessages:', err);
            }

            await deleteDoc(convDoc.ref);
            deletedConversationsCount++;
          }
        }
      } catch (err) {
        console.warn('Error cleaning Firestore conversations:', err);
      }
    }

    // 3. Clean up localStorage
    if (typeof window !== 'undefined') {
      try {
        if (userId) {
          localStorage.removeItem(`intima_convs_${userId}`);
        }
        localStorage.removeItem('intima_convs_guest');
        
        // Remove all intima_msgs_* keys and conversation keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('intima_msgs_') || key.startsWith('intima_convs_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }

    // 4. Reset server metrics to zero via API
    try {
      await fetch('/api/admin/reset-metrics', { method: 'POST' });
    } catch (e) {
      console.warn('Error resetting metrics API:', e);
    }

    return {
      success: true,
      deletedConversationsCount,
      deletedMessagesCount,
      backupData,
    };
  },

  // Call server-side Autonomous INTIMA Agent API
  async sendToGemini(
    messages: {
      role: 'user' | 'assistant';
      content: string;
      attachments?: {
        name: string;
        type: string;
        size: number;
        dataUrl?: string;
      }[];
    }[],
    userContext?: {
      relationshipStatus?: string;
      partnerName?: string;
      userName?: string;
      topic?: string;
      language?: Language;
      memories?: string[];
    },
    enableWebResearch?: boolean
  ): Promise<{
    content: string;
    facts?: string;
    hypotheses?: string;
    suggestedAction?: string;
    sources?: any[];
    providerUsed?: string;
    modelUsed?: string;
    latencyMs?: number;
    qualityAssessment?: any;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userContext, enableWebResearch }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Erreur lors de la réponse d’INTIMA');
    }

    return await res.json();
  },

  // Direct call to OpenAI Responses API endpoint
  async sendToOpenAI(
    messages: {
      role: 'user' | 'assistant';
      content: string;
    }[],
    userContext?: {
      relationshipStatus?: string;
      partnerName?: string;
      userName?: string;
      topic?: string;
      language?: Language;
      memories?: string[];
    },
    model?: string
  ): Promise<{
    content: string;
    facts?: string;
    hypotheses?: string;
    suggestedAction?: string;
    providerUsed?: string;
    modelUsed?: string;
    latencyMs?: number;
    tokensUsed?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const res = await fetch('/api/chat/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userContext, model }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Erreur OpenAI');
    }

    return await res.json();
  },

  // Call server-side Gemini TTS API
  async synthesizeSpeech(text: string, voiceName?: string, language: Language = 'fr'): Promise<string> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName, language }),
    });

    if (!res.ok) {
      throw new Error('Synthèse vocale indisponible');
    }

    const data = await res.json();
    return data.audioUrl;
  },
};
