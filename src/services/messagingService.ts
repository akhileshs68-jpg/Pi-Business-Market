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
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Conversation, 
  Message, 
  ConversationType,
  MessageType
} from '../types';

export const messagingService = {
  /**
   * INITIATE OR FETCH CONVERSATION
   * Ensures unique conversation for specific context (e.g., User A & Business B about Order X)
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
    
    // Sort participants to ensure consistent ID generation for direct chats
    const sortedParticipants = [...participants].sort();
    
    // Check and generate specific conversation IDs for orders, bookings, products to prevent collision
    let conversationId = `CONV_${sortedParticipants.join('_')}`;
    
    const resolvedOrderId = options?.orderId || (options?.relatedEntityType === 'order' ? options?.relatedEntityId : undefined);
    const resolvedBookingId = options?.bookingId || (options?.relatedEntityType === 'booking' ? options?.relatedEntityId : undefined);
    const resolvedProductId = options?.productId || (options?.relatedEntityType === 'product' ? options?.relatedEntityId : undefined);

    if (resolvedOrderId) {
      conversationId = `CONV_ORDER_${resolvedOrderId}`;
    } else if (resolvedBookingId) {
      conversationId = `CONV_BOOKING_${resolvedBookingId}`;
    } else if (resolvedProductId) {
      conversationId = `CONV_PRODUCT_${resolvedProductId}_${sortedParticipants.join('_')}`;
    } else if (options?.relatedEntityId) {
      conversationId = `CONV_${options.relatedEntityId}`;
    }

    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      return this.mapDocToConversation(snap);
    }

    const unreadCounts: Record<string, number> = {};
    participants.forEach(uid => unreadCounts[uid] = 0);

    const newConversation: Conversation = {
      conversationId,
      type,
      participants: sortedParticipants,
      businessId: options?.businessId,
      storeId: options?.storeId,
      productId: resolvedProductId,
      orderId: resolvedOrderId,
      bookingId: resolvedBookingId,
      relatedEntityType: options?.relatedEntityType,
      relatedEntityId: options?.relatedEntityId,
      status: 'active',
      unreadCounts,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(convRef, {
      ...newConversation,
      lastActivity: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newConversation;
  },

  /**
   * SEND MESSAGE
   * Uses transaction to update unread counts and last message snippet atomically
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
    const messageId = `MSG_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const convRef = doc(db, 'conversations', conversationId);

    const message: Message = {
      messageId,
      conversationId,
      senderUid,
      senderRole,
      messageType: type,
      content,
      text: content,
      attachments,
      replyTo,
      status: 'sent',
      edited: false,
      deleted: false,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await runTransaction(db, async (transaction) => {
      const convSnap = await transaction.get(convRef);
      if (!convSnap.exists()) throw new Error('Conversation does not exist');
      
      const convData = convSnap.data() as Conversation;
      const updates: any = {
        lastMessage: {
          content: type === 'text' ? content : `[${type}]`,
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

      transaction.set(messageRef, {
        ...message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      transaction.update(convRef, updates);
    });

    return messageId;
  },

  /**
   * REAL-TIME SUBSCRIPTIONS
   */
  subscribeToConversations(userUid: string, callback: (conversations: Conversation[]) => void) {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userUid),
      where('status', '==', 'active'),
      orderBy('lastActivity', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => this.mapDocToConversation(doc));
      callback(conversations);
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
