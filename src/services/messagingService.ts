import { aiEngineService } from './aiEngineService';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  arrayUnion
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Conversation, 
  Message, 
  ConversationType,
  MessageType
} from '../types';
import { notificationService } from './notificationService';

// Client-side transient cache for rate limiting & spam prevention
const clientRateLimitCache: Record<string, { lastSentTime: number; lastContent: string }> = {};

function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)).filter(item => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    // Do NOT iterate over internal properties of custom class instances (like FieldValue, Timestamp, Date)
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return obj;
    }
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const messagingService = {
  /**
   * INITIATE OR FETCH CONVERSATION
   * Ensures ONE conversation for any given context to satisfy "ONE CONVERSATION POLICY".
   */
  async getOrCreateConversation(
    participants: string[], // [userUid, otherUid/businessOwnerUid]
    type: ConversationType,
    options?: {
      businessId?: string;
      storeId?: string;
      productId?: string;
      orderId?: string;
      bookingId?: string;
      relatedEntityType?: any;
      relatedEntityId?: string;
    }
  ): Promise<Conversation> {
    const db = getFirebaseDb();
    
    // Clean and sort participants to ensure stable, unique direct chat keys
    const cleanParticipants = Array.from(new Set(participants.filter(Boolean)));
    const sortedParticipants = [...cleanParticipants].sort();
    
    const resolvedOrderId = options?.orderId || (options?.relatedEntityType === 'order' ? options?.relatedEntityId : undefined);
    const resolvedBookingId = options?.bookingId || (options?.relatedEntityType === 'booking' ? options?.relatedEntityId : undefined);
    const resolvedProductId = options?.productId || (options?.relatedEntityType === 'product' ? options?.relatedEntityId : undefined);
    const resolvedBusinessId = options?.businessId || (options?.relatedEntityType === 'business_customer' ? options?.relatedEntityId : undefined);

    // Compute deterministic ID based on context to satisfy ONE CONVERSATION POLICY
    let conversationId = `CONV_${sortedParticipants.join('_')}`;
    
    if (resolvedOrderId) {
      conversationId = `CONV_ORDER_${resolvedOrderId}`;
    } else if (resolvedBookingId) {
      conversationId = `CONV_BOOKING_${resolvedBookingId}`;
    } else if (resolvedProductId) {
      conversationId = `CONV_PRODUCT_${resolvedProductId}_${sortedParticipants.join('_')}`;
    } else if (resolvedBusinessId) {
      conversationId = `CONV_BUSINESS_${resolvedBusinessId}_${sortedParticipants.join('_')}`;
    } else if (options?.relatedEntityId) {
      conversationId = `CONV_${options.relatedEntityId}`;
    }

    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      return this.mapDocToConversation(snap);
    }

    // Security check: Ensure we do not allow empty participants list
    if (sortedParticipants.length === 0) {
      throw new Error('Participants list cannot be empty.');
    }

    const unreadCounts: Record<string, number> = {};
    sortedParticipants.forEach(uid => unreadCounts[uid] = 0);

    const newConversation: Conversation = {
      conversationId,
      type,
      participants: sortedParticipants,
      status: 'active',
      unreadCounts,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const targetBizId = resolvedBusinessId || options?.businessId;
    if (targetBizId) newConversation.businessId = targetBizId;
    if (options?.storeId) newConversation.storeId = options.storeId;
    if (resolvedProductId) newConversation.productId = resolvedProductId;
    if (resolvedOrderId) newConversation.orderId = resolvedOrderId;
    if (resolvedBookingId) newConversation.bookingId = resolvedBookingId;

    const relType = options?.relatedEntityType || (resolvedOrderId ? 'order' : resolvedProductId ? 'product' : undefined);
    if (relType) newConversation.relatedEntityType = relType;

    const relId = options?.relatedEntityId || resolvedOrderId || resolvedProductId || resolvedBookingId;
    if (relId) newConversation.relatedEntityId = relId;

    const convDataRaw = {
      ...newConversation,
      lastActivity: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const convData = removeUndefinedFields(convDataRaw);
    console.log('[MessagingService] Complete conversation object writing to Firestore:', convData);

    await setDoc(convRef, convData);

    // Create a secure messaging audit log
    await this.logAudit('CONVERSATION_CREATED', {
      conversationId,
      participants: sortedParticipants,
      type
    });

    return newConversation;
  },

  /**
   * SEND MESSAGE
   * Enforces Rate Limiting, Duplicate Prevention, Spam Filtering and User Blocks.
   */
  async sendMessage(
    conversationId: string,
    senderUid: string,
    content: string,
    type: MessageType = 'text',
    attachments?: string[],
    metadata?: Record<string, any>,
    replyTo?: string,
    senderRole?: string
  ): Promise<string> {
    const db = getFirebaseDb();
    const now = Date.now();

    
    // AI CONTENT MODERATION
    if (type === 'text' && content) {
      const moderation = await aiEngineService.moderateContent(content, 'message');
      if (!moderation.isSafe) {
        throw new Error('CONTENT_MODERATION: ' + moderation.reason);
      }
    }

    // 1. RATE LIMITING & FLOOD PROTECTION
    const lastSent = clientRateLimitCache[senderUid];
    if (lastSent) {
      const diff = now - lastSent.lastSentTime;
      if (diff < 1000) {
        throw new Error('RATE_LIMIT: Messages sent too fast. Please wait 1 second.');
      }
      
      // 2. DUPLICATE MESSAGE DETECTION
      if (content === lastSent.lastContent && diff < 10000 && type === 'text') {
        throw new Error('DUPLICATE_MESSAGE: You just sent this message. Please avoid repeating.');
      }
    }

    // 3. SPAM KEYWORD SCANNING
    const spamWords = ['free coin', 'unlimited pi', 'cheat', 'hack', 'fake transfer', 'scam coin'];
    const lowerContent = content.toLowerCase();
    const isSpam = spamWords.some(word => lowerContent.includes(word));
    
    const enrichedMetadata = {
      ...(metadata || {}),
      spamDetected: isSpam,
      flagged: isSpam ? true : undefined,
      antiCheatVerified: true,
      timestampMillis: now
    };

    if (isSpam) {
      console.warn(`Spam content flagged from user ${senderUid} in conversation ${conversationId}`);
    }

    // 4. BLOCK STATUS SECURITY CHECK
    const conversation = await this.getConversation(conversationId);
    if (conversation.status === 'blocked') {
      throw new Error('BLOCKED: This conversation is currently blocked or moderated.');
    }

    // Check individual user block list
    const otherParticipant = conversation.participants.find(p => p !== senderUid);
    if (otherParticipant) {
      const blockCheck = await this.isBlocked(otherParticipant, senderUid);
      if (blockCheck) {
        throw new Error('BLOCKED: You cannot send messages to this user.');
      }
    }

    // Update transient cache
    clientRateLimitCache[senderUid] = {
      lastSentTime: now,
      lastContent: content
    };

    const messageId = `MSG_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const convRef = doc(db, 'conversations', conversationId);

    const message: Message = {
      messageId,
      conversationId,
      senderUid,
      senderRole: senderRole || 'User',
      messageType: type,
      content,
      text: content,
      attachments,
      replyTo,
      status: 'sent',
      edited: false,
      deleted: false,
      metadata: enrichedMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await runTransaction(db, async (transaction) => {
      const convSnap = await transaction.get(convRef);
      if (!convSnap.exists()) throw new Error('Conversation does not exist');
      
      const convData = convSnap.data() as Conversation;
      const updates: any = {
        lastMessage: {
          content: type === 'text' ? content : `[${type.replace('_', ' ')}]`,
          senderUid,
          createdAt: serverTimestamp()
        },
        lastMessageTime: new Date().toISOString(),
        lastSenderId: senderUid,
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Increment unread counts for all other participants
      convData.participants.forEach(uid => {
        if (uid !== senderUid) {
          updates[`unreadCounts.${uid}`] = increment(1);
        }
      });

      const msgDataRaw = {
        ...message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const msgData = removeUndefinedFields(msgDataRaw);
      console.log('[MessagingService] Complete message object writing to Firestore:', msgData);

      transaction.set(messageRef, msgData);
      
      transaction.update(convRef, updates);
    });

    // Generate in-app notifications
    try {
      const recipients = conversation.participants.filter(p => p !== senderUid);
      for (const recipientId of recipients) {
        await notificationService.notify(
          recipientId,
          'message_new',
          `New Message from ${senderRole || 'Client'}`,
          type === 'text' ? content : `Sent a ${type.replace('_', ' ')} attachment`,
          { entityId: conversationId, entityType: 'conversation', linkTo: '/inbox' }
        );
      }
    } catch (notifErr) {
      console.warn('Failed to send message notifications:', notifErr);
    }

    return messageId;
  },

  /**
   * GET CONVERSATION BY ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'conversations', conversationId));
    if (!snap.exists()) {
      throw new Error(`Conversation ${conversationId} not found.`);
    }
    return this.mapDocToConversation(snap);
  },

  /**
   * USER BLOCKING CONTROLS
   */
  async blockUser(userUid: string, blockedUid: string): Promise<void> {
    const db = getFirebaseDb();
    const blockRef = doc(db, 'blockedUsers', `${userUid}_${blockedUid}`);
    await setDoc(blockRef, {
      userUid,
      blockedUid,
      createdAt: serverTimestamp()
    });
    
    await this.logAudit('USER_BLOCKED', { userUid, blockedUid });
  },

  async unblockUser(userUid: string, blockedUid: string): Promise<void> {
    const db = getFirebaseDb();
    const blockRef = doc(db, 'blockedUsers', `${userUid}_${blockedUid}`);
    await setDoc(blockRef, {
      deleted: true,
      unblockedAt: serverTimestamp()
    });
  },

  async isBlocked(userUid: string, otherUid: string): Promise<boolean> {
    const db = getFirebaseDb();
    // Check if userUid blocked otherUid
    const blockRef1 = doc(db, 'blockedUsers', `${userUid}_${otherUid}`);
    const snap1 = await getDoc(blockRef1);
    if (snap1.exists() && !snap1.data()?.deleted) return true;

    // Check if otherUid blocked userUid
    const blockRef2 = doc(db, 'blockedUsers', `${otherUid}_${userUid}`);
    const snap2 = await getDoc(blockRef2);
    return snap2.exists() && !snap2.data()?.deleted;
  },

  /**
   * REPORT CONVERSATION
   */
  async reportConversation(conversationId: string, reporterUid: string, reason: string): Promise<void> {
    const db = getFirebaseDb();
    const reportId = `REP_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    await setDoc(doc(db, 'reportedConversations', reportId), {
      reportId,
      conversationId,
      reporterUid,
      reason,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    await this.logAudit('CONVERSATION_REPORTED', { conversationId, reporterUid, reason });
  },

  /**
   * SECURITY AUDIT LOGS
   */
  async logAudit(action: string, details: Record<string, any>): Promise<void> {
    try {
      const db = getFirebaseDb();
      const logId = `AUDIT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        logId,
        domain: 'messaging',
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Audit logger failed silenty:', err);
    }
  },

  /**
   * REAL-TIME SUBSCRIPTIONS
   */
  subscribeToConversations(userUid: string, callback: (conversations: Conversation[]) => void) {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userUid),
      where('status', '==', 'active')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => this.mapDocToConversation(doc))
        .filter(conv => !(conv.deletedBy && conv.deletedBy.includes(userUid))) // Filter out deleted for this user
        .sort((a, b) => {
          const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return timeB - timeA;
        });
      callback(conversations);
    }, (err) => {
      console.error('[MessagingService] error in subscribeToConversations:', err);
    });
  },

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => this.mapDocToMessage(doc));
      callback(messages);
    });
  },

  async archiveConversation(conversationId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      archivedBy: arrayUnion(userUid)
    });
  },

  async deleteConversationForUser(conversationId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      deletedBy: arrayUnion(userUid)
    });
  },

  async markAsRead(conversationId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`unreadCounts.${userUid}`]: 0
    });
  },

  /**
   * HELPERS
   */
  mapDocToConversation(doc: any): Conversation {
    const data = doc.data();
    return {
      ...data,
      lastActivity: data.lastActivity instanceof Timestamp ? data.lastActivity.toDate().toISOString() : data.lastActivity,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      lastMessage: data.lastMessage ? {
        ...data.lastMessage,
        createdAt: data.lastMessage.createdAt instanceof Timestamp ? data.lastMessage.createdAt.toDate().toISOString() : data.lastMessage.createdAt
      } : undefined
    } as Conversation;
  },

  mapDocToMessage(doc: any): Message {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Message;
  }
};
