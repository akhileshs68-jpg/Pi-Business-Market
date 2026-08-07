import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { notificationService } from './notificationService';

export type DisputeStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'BUYER_RESPONDED'
  | 'SELLER_RESPONDED'
  | 'RESOLVED'
  | 'REFUNDED'
  | 'REJECTED';

export interface DisputeEvent {
  id?: string;
  disputeId: string;
  type: string;
  actorUid: string;
  actorName?: string;
  actorRole: 'BUYER' | 'SELLER' | 'ADMIN' | 'SYSTEM';
  message: string;
  statusChange?: DisputeStatus;
  attachments?: string[];
  timestamp: string;
}

export interface DisputeMessage {
  id?: string;
  disputeId: string;
  senderUid: string;
  senderName: string;
  senderRole: 'BUYER' | 'SELLER' | 'ADMIN';
  text: string;
  attachments?: string[];
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  disputeId: string;
  orderId: string;
  orderNumber?: string;
  buyerUid: string;
  buyerName?: string;
  sellerUid: string;
  sellerName?: string;
  businessId?: string;
  reason: string;
  category: string;
  description: string;
  status: DisputeStatus;
  requestedRefundAmount?: number;
  grantedRefundAmount?: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolvedByUid?: string;
}

export const disputeService = {
  /**
   * Create a new Dispute record
   */
  async createDispute(params: {
    orderId: string;
    orderNumber?: string;
    buyerUid: string;
    buyerName?: string;
    sellerUid: string;
    sellerName?: string;
    businessId?: string;
    category: string;
    reason: string;
    description: string;
    requestedRefundAmount?: number;
    attachments?: string[];
  }): Promise<string> {
    const db = getFirebaseDb();
    const disputeRef = doc(collection(db, 'disputes'));
    const disputeId = disputeRef.id;
    const nowIso = new Date().toISOString();

    const disputeData: DisputeRecord = {
      id: disputeId,
      disputeId,
      orderId: params.orderId,
      orderNumber: params.orderNumber || params.orderId,
      buyerUid: params.buyerUid,
      buyerName: params.buyerName || 'Buyer',
      sellerUid: params.sellerUid,
      sellerName: params.sellerName || 'Seller',
      businessId: params.businessId || '',
      category: params.category || 'Item Issue',
      reason: params.reason,
      description: params.description,
      status: 'OPEN',
      requestedRefundAmount: params.requestedRefundAmount || 0,
      attachments: params.attachments || [],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1. Save dispute document
    await setDoc(disputeRef, disputeData);

    // 2. Create initial timeline event
    const eventRef = doc(collection(db, `disputes/${disputeId}/events`));
    await setDoc(eventRef, {
      id: eventRef.id,
      disputeId,
      type: 'DISPUTE_CREATED',
      actorUid: params.buyerUid,
      actorName: params.buyerName || 'Buyer',
      actorRole: 'BUYER',
      message: `Dispute opened (${params.category}): ${params.reason}`,
      statusChange: 'OPEN',
      attachments: params.attachments || [],
      timestamp: nowIso
    });

    // 3. Update Order document
    try {
      const orderRef = doc(db, 'orders', params.orderId);
      await updateDoc(orderRef, {
        disputeStatus: 'opened',
        disputeId,
        disputeReason: params.reason,
        orderStatus: 'disputed',
        updatedAt: nowIso
      });
    } catch (e) {
      console.warn('[disputeService] Could not update order doc directly:', e);
    }

    // 4. Send Notifications
    try {
      if (params.sellerUid) {
        await notificationService.notify(
          params.sellerUid,
          'dispute_update',
          'Dispute Opened on Order',
          `A buyer opened a dispute for Order ${params.orderNumber || params.orderId}: ${params.reason}`,
          { entityId: disputeId, entityType: 'dispute', linkTo: `/order-details/${params.orderId}` }
        );
      }
    } catch (e) {
      console.warn('[disputeService] Failed to notify seller:', e);
    }

    return disputeId;
  },

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string): Promise<DisputeRecord | null> {
    const db = getFirebaseDb();
    try {
      const snap = await getDoc(doc(db, 'disputes', disputeId));
      if (snap.exists()) {
        return snap.data() as DisputeRecord;
      }
    } catch (e) {
      console.warn('[disputeService] getDispute error:', e);
    }
    return null;
  },

  /**
   * Find dispute by Order ID
   */
  async getDisputeByOrderId(orderId: string): Promise<DisputeRecord | null> {
    const db = getFirebaseDb();
    try {
      const q = query(collection(db, 'disputes'), where('orderId', '==', orderId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as DisputeRecord;
      }
    } catch (e) {
      console.warn('[disputeService] getDisputeByOrderId error:', e);
    }
    return null;
  },

  /**
   * Live real-time listener for Dispute document
   */
  subscribeDispute(disputeId: string, callback: (dispute: DisputeRecord | null) => void) {
    const db = getFirebaseDb();
    const ref = doc(db, 'disputes', disputeId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as DisputeRecord);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('[disputeService] subscribeDispute error:', err);
      callback(null);
    });
  },

  /**
   * Live real-time listener for Dispute Messages
   */
  subscribeDisputeMessages(disputeId: string, callback: (messages: DisputeMessage[]) => void) {
    const db = getFirebaseDb();
    const ref = collection(db, `disputes/${disputeId}/messages`);
    return onSnapshot(ref, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DisputeMessage[];
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      callback(msgs);
    }, (err) => {
      console.warn('[disputeService] subscribeDisputeMessages error:', err);
      callback([]);
    });
  },

  /**
   * Live real-time listener for Dispute Events Timeline
   */
  subscribeDisputeEvents(disputeId: string, callback: (events: DisputeEvent[]) => void) {
    const db = getFirebaseDb();
    const ref = collection(db, `disputes/${disputeId}/events`);
    return onSnapshot(ref, (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DisputeEvent[];
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(events);
    }, (err) => {
      console.warn('[disputeService] subscribeDisputeEvents error:', err);
      callback([]);
    });
  },

  /**
   * Send a message inside a dispute chat
   */
  async sendMessage(params: {
    disputeId: string;
    senderUid: string;
    senderName: string;
    senderRole: 'BUYER' | 'SELLER' | 'ADMIN';
    text: string;
    attachments?: string[];
  }): Promise<void> {
    const db = getFirebaseDb();
    const nowIso = new Date().toISOString();

    // 1. Add message
    const msgRef = doc(collection(db, `disputes/${params.disputeId}/messages`));
    await setDoc(msgRef, {
      id: msgRef.id,
      disputeId: params.disputeId,
      senderUid: params.senderUid,
      senderName: params.senderName,
      senderRole: params.senderRole,
      text: params.text,
      attachments: params.attachments || [],
      createdAt: nowIso
    });

    // 2. Automatically advance status depending on sender
    const disputeSnap = await getDoc(doc(db, 'disputes', params.disputeId));
    if (disputeSnap.exists()) {
      const current = disputeSnap.data() as DisputeRecord;
      let newStatus: DisputeStatus = current.status;

      if (params.senderRole === 'BUYER' && ['SELLER_RESPONDED', 'UNDER_REVIEW'].includes(current.status)) {
        newStatus = 'BUYER_RESPONDED';
      } else if (params.senderRole === 'SELLER' && ['OPEN', 'BUYER_RESPONDED', 'UNDER_REVIEW'].includes(current.status)) {
        newStatus = 'SELLER_RESPONDED';
      }

      await updateDoc(doc(db, 'disputes', params.disputeId), {
        status: newStatus,
        updatedAt: nowIso
      });

      // 3. Add event to timeline
      const eventRef = doc(collection(db, `disputes/${params.disputeId}/events`));
      await setDoc(eventRef, {
        id: eventRef.id,
        disputeId: params.disputeId,
        type: 'MESSAGE_SENT',
        actorUid: params.senderUid,
        actorName: params.senderName,
        actorRole: params.senderRole,
        message: `${params.senderRole} sent message: "${params.text.slice(0, 60)}${params.text.length > 60 ? '...' : ''}"`,
        statusChange: newStatus !== current.status ? newStatus : undefined,
        attachments: params.attachments || [],
        timestamp: nowIso
      });

      // 4. Notify counterparty
      const recipientUid = params.senderRole === 'BUYER' ? current.sellerUid : current.buyerUid;
      if (recipientUid) {
        await notificationService.notify(
          recipientUid,
          'dispute_update',
          'New Dispute Message',
          `${params.senderName} (${params.senderRole}) sent a message on Dispute #${params.disputeId.slice(-6)}`,
          { entityId: params.disputeId, entityType: 'dispute', linkTo: `/order-details/${current.orderId}` }
        );
      }
    }
  },

  /**
   * Update status of dispute (e.g. Admin or Seller resolution)
   */
  async updateStatus(params: {
    disputeId: string;
    newStatus: DisputeStatus;
    actorUid: string;
    actorName?: string;
    actorRole: 'BUYER' | 'SELLER' | 'ADMIN';
    notes?: string;
    grantedRefundAmount?: number;
  }): Promise<void> {
    const db = getFirebaseDb();
    const nowIso = new Date().toISOString();
    const disputeRef = doc(db, 'disputes', params.disputeId);
    const snap = await getDoc(disputeRef);

    if (!snap.exists()) throw new Error('Dispute not found');
    const dispute = snap.data() as DisputeRecord;

    const updatePayload: any = {
      status: params.newStatus,
      updatedAt: nowIso
    };

    if (params.notes) {
      updatePayload.resolutionNotes = params.notes;
    }
    if (params.grantedRefundAmount !== undefined) {
      updatePayload.grantedRefundAmount = params.grantedRefundAmount;
    }
    if (['RESOLVED', 'REFUNDED', 'REJECTED'].includes(params.newStatus)) {
      updatePayload.resolvedAt = nowIso;
      updatePayload.resolvedByUid = params.actorUid;
    }

    await updateDoc(disputeRef, updatePayload);

    // Timeline event
    const eventRef = doc(collection(db, `disputes/${params.disputeId}/events`));
    await setDoc(eventRef, {
      id: eventRef.id,
      disputeId: params.disputeId,
      type: `STATUS_${params.newStatus}`,
      actorUid: params.actorUid,
      actorName: params.actorName || params.actorRole,
      actorRole: params.actorRole,
      message: params.notes || `Dispute status updated to ${params.newStatus}`,
      statusChange: params.newStatus,
      timestamp: nowIso
    });

    // Sync order if resolved/refunded
    try {
      const orderRef = doc(db, 'orders', dispute.orderId);
      let orderStatusToSet = 'disputed';
      if (params.newStatus === 'REFUNDED') orderStatusToSet = 'refunded';
      if (params.newStatus === 'RESOLVED') orderStatusToSet = 'completed';

      await updateDoc(orderRef, {
        disputeStatus: params.newStatus.toLowerCase(),
        orderStatus: orderStatusToSet,
        updatedAt: nowIso
      });
    } catch (e) {
      console.warn('[disputeService] Could not update order doc:', e);
    }

    // Notifications
    try {
      const msg = `Dispute status changed to ${params.newStatus}. ${params.notes || ''}`;
      if (dispute.buyerUid) {
        await notificationService.notify(dispute.buyerUid, 'dispute_update', 'Dispute Status Updated', msg, { entityId: params.disputeId, entityType: 'dispute' });
      }
      if (dispute.sellerUid) {
        await notificationService.notify(dispute.sellerUid, 'dispute_update', 'Dispute Status Updated', msg, { entityId: params.disputeId, entityType: 'dispute' });
      }
    } catch (e) {
      console.warn('[disputeService] Notification error:', e);
    }
  },

  /**
   * Get all disputes for a user or admin list
   */
  async getDisputes(params?: { userId?: string; role?: 'BUYER' | 'SELLER' | 'ADMIN'; status?: DisputeStatus }): Promise<DisputeRecord[]> {
    const db = getFirebaseDb();
    try {
      let q = query(collection(db, 'disputes'));
      if (params?.userId && params?.role === 'BUYER') {
        q = query(collection(db, 'disputes'), where('buyerUid', '==', params.userId));
      } else if (params?.userId && params?.role === 'SELLER') {
        q = query(collection(db, 'disputes'), where('sellerUid', '==', params.userId));
      }
      const snap = await getDocs(q);
      let disputes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DisputeRecord[];

      if (params?.status) {
        disputes = disputes.filter(d => d.status === params.status);
      }
      return disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn('[disputeService] getDisputes error:', e);
      return [];
    }
  }
};
