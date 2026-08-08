/**
 * Pi Business Market - Enterprise Universal Approval Center Service
 * Centralized service to govern approvals, notifications, audit logs, and status transitions.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  increment,
  addDoc
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import {
  UniversalApproval,
  ApprovalType,
  ApprovalStatus,
  ApprovalPriority,
  ApprovalAuditLog,
  ApprovalNotification,
  ApprovalHistoryEvent
} from '../types';

// Valid status transitions for Common Workflow
const VALID_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  'Draft': ['Submitted'],
  'Submitted': ['Pending Review'],
  'Pending Review': ['Under Review', 'On Hold', 'Approved', 'Rejected', 'Need Changes'],
  'Under Review': ['Approved', 'Rejected', 'Need Changes', 'On Hold'],
  'Need Changes': ['Submitted', 'Pending Review'],
  'On Hold': ['Pending Review', 'Under Review', 'Approved', 'Rejected'],
  'Approved': ['Expired'], // Approved is terminal, but could expire
  'Rejected': [], // Terminal
  'Expired': [] // Terminal
};

// Check if a state transition is permitted
export function isValidTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export class ApprovalService {
  private static instance: ApprovalService;

  private constructor() {}

  public static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  private getCollection() {
    return collection(getFirebaseDb(), 'universalApprovals');
  }

  private getAuditLogsCollection() {
    return collection(getFirebaseDb(), 'approvalAuditLogs');
  }

  private getNotificationsCollection() {
    return collection(getFirebaseDb(), 'approvalNotifications');
  }

  /**
   * Fetch paginated and filtered approvals from Firestore.
   */
  public async getApprovals(params: {
    approvalType?: string;
    businessId?: string;
    storeId?: string;
    status?: string;
    priority?: string;
    reviewerUid?: string;
    keyword?: string;
    pageSize?: number;
    lastDocSnapshot?: DocumentSnapshot | null;
  }): Promise<{ approvals: UniversalApproval[]; lastDoc: DocumentSnapshot | null }> {
    const db = getFirebaseDb();
    const approvalsRef = this.getCollection();
    
    // We fetch a batch and then filter locally for any complex keyword searches to avoid unindexed queries
    let q = query(approvalsRef, orderBy('updatedAt', 'desc'));

    if (params.status && params.status !== 'All') {
      q = query(q, where('status', '==', params.status));
    }
    if (params.priority && params.priority !== 'All') {
      q = query(q, where('priority', '==', params.priority));
    }
    if (params.approvalType && params.approvalType !== 'All') {
      q = query(q, where('approvalType', '==', params.approvalType));
    }
    if (params.reviewerUid && params.reviewerUid !== 'All') {
      q = query(q, where('assignedReviewer.uid', '==', params.reviewerUid));
    }

    const pageSize = params.pageSize || 10;
    
    // Since complex combination query constraints might require multiple indexes,
    // we fetch and then filter out by keywords/business/store locally if required.
    // However, to keep it highly performant and avoid collection scans, we apply pagination startAfter
    if (params.lastDocSnapshot) {
      q = query(q, startAfter(params.lastDocSnapshot));
    }

    q = query(q, firestoreLimit(pageSize * 3)); // fetch a larger batch so we can filter business/store/keyword locally if needed

    const querySnapshot = await getDocs(q);
    let rawResults: UniversalApproval[] = [];
    
    querySnapshot.forEach((doc) => {
      rawResults.push({ id: doc.id, ...doc.data() } as UniversalApproval);
    });

    let lastDoc: DocumentSnapshot | null = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    // Apply filters that aren't easily indexed or need custom logical match
    if (params.businessId && params.businessId !== 'All') {
      rawResults = rawResults.filter(a => a.business?.id === params.businessId);
    }
    if (params.storeId && params.storeId !== 'All') {
      rawResults = rawResults.filter(a => a.store?.id === params.storeId);
    }

    // Keyword search reuse
    if (params.keyword && params.keyword.trim().length > 0) {
      const kw = params.keyword.toLowerCase();
      rawResults = rawResults.filter(a => 
        a.entityName.toLowerCase().includes(kw) ||
        a.id.toLowerCase().includes(kw) ||
        a.submittedBy.name.toLowerCase().includes(kw) ||
        (a.business && a.business.name.toLowerCase().includes(kw)) ||
        (a.store && a.store.name.toLowerCase().includes(kw))
      );
    }

    // Slice to the actual page size requested
    const sliced = rawResults.slice(0, pageSize);

    return {
      approvals: sliced,
      lastDoc
    };
  }

  /**
   * Fetch approval by Document ID.
   */
  public async getApprovalById(id: string): Promise<UniversalApproval | null> {
    const docRef = doc(getFirebaseDb(), 'universalApprovals', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UniversalApproval;
  }

  /**
   * Action executor on an approval request.
   * Validates state transition, updates Firestore, records audit log, and dispatches notifications.
   */
  public async performApprovalAction(
    approvalId: string,
    action: 'Approve' | 'Reject' | 'Need Changes' | 'Hold' | 'Resume' | 'Escalate' | 'Assign Reviewer' | 'Reassign' | 'Archive',
    reason: string,
    notes: string,
    adminUser: { uid: string; displayName: string; email?: string }
  ): Promise<UniversalApproval> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'universalApprovals', approvalId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      throw new Error(`Approval record with ID ${approvalId} not found.`);
    }

    const currentData = snap.data() as UniversalApproval;
    const oldStatus = currentData.status;
    let newStatus = oldStatus;
    let newPriority = currentData.priority;
    let newReviewer = currentData.assignedReviewer;
    let newArchived = currentData.archived || false;

    // Determine state transition based on action
    switch (action) {
      case 'Approve':
        newStatus = 'Approved';
        break;
      case 'Reject':
        newStatus = 'Rejected';
        break;
      case 'Need Changes':
        newStatus = 'Need Changes';
        break;
      case 'Hold':
        newStatus = 'On Hold';
        break;
      case 'Resume':
        // Resume returns it to Under Review or Pending Review
        newStatus = 'Under Review';
        break;
      case 'Escalate':
        // Escalation bumps priority to Critical / High
        newPriority = newPriority === 'Low' ? 'Medium' : newPriority === 'Medium' ? 'High' : 'Critical';
        break;
      case 'Assign Reviewer':
      case 'Reassign':
        // Expected notes to contain "uid|name" of the assignee
        if (notes && notes.includes('|')) {
          const [reviewerUid, reviewerName] = notes.split('|');
          newReviewer = { uid: reviewerUid, name: reviewerName };
        }
        break;
      case 'Archive':
        newArchived = true;
        break;
      default:
        throw new Error(`Invalid action type: ${action}`);
    }

    // Validate the status transition
    if (newStatus !== oldStatus && !isValidTransition(oldStatus, newStatus)) {
      throw new Error(`State transition from ${oldStatus} to ${newStatus} is unauthorized/invalid.`);
    }

    // Create history event
    const historyEvent: ApprovalHistoryEvent = {
      eventId: doc(collection(db, 'temp')).id,
      action,
      oldStatus,
      newStatus,
      adminUid: adminUser.uid,
      adminName: adminUser.displayName,
      reason,
      notes: notes || undefined,
      timestamp: new Date().toISOString()
    };

    const updatedTimeline = [...(currentData.historyTimeline || []), historyEvent];

    const updatedFields: Partial<UniversalApproval> = {
      status: newStatus,
      priority: newPriority,
      assignedReviewer: newReviewer,
      archived: newArchived,
      historyTimeline: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(docRef, updatedFields);

    // Write immutable Audit Log
    const auditLogId = doc(collection(db, 'temp')).id;
    const auditLog: ApprovalAuditLog = {
      id: auditLogId,
      adminUid: adminUser.uid,
      adminName: adminUser.displayName,
      approvalType: currentData.approvalType,
      entityId: currentData.entityId,
      entityName: currentData.entityName,
      action,
      oldStatus,
      newStatus,
      reason,
      notes: notes || undefined,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1' // local system ip simulation
    };
    await setDoc(doc(db, 'approvalAuditLogs', auditLogId), auditLog);

    // Send automated notifications
    await this.notifyParties(currentData, action, reason, adminUser, newReviewer);

    return {
      ...currentData,
      ...updatedFields,
      id: approvalId
    };
  }

  /**
   * Add a comment to an approval record.
   */
  public async addComment(
    approvalId: string,
    author: { uid: string; displayName: string },
    content: string
  ): Promise<UniversalApproval> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'universalApprovals', approvalId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('Approval record not found');
    }

    const currentData = snap.data() as UniversalApproval;
    const newComment = {
      commentId: doc(collection(db, 'temp')).id,
      authorUid: author.uid,
      authorName: author.displayName,
      content,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...(currentData.comments || []), newComment];
    await updateDoc(docRef, { comments: updatedComments });

    return {
      ...currentData,
      comments: updatedComments,
      id: approvalId
    };
  }

  /**
   * Triggers and writes notifications for the workflow parties.
   */
  private async notifyParties(
    approval: UniversalApproval,
    action: string,
    reason: string,
    admin: { displayName: string },
    reviewer?: { uid: string; name: string }
  ) {
    const db = getFirebaseDb();
    const notificationsCollection = this.getNotificationsCollection();
    const timestamp = new Date().toISOString();

    const dispatchNotification = async (recipientUid: string, title: string, message: string, priority: 'low' | 'normal' | 'high') => {
      const notifId = doc(collection(db, 'temp')).id;
      const notif: ApprovalNotification = {
        id: notifId,
        recipientUid,
        title,
        message,
        priority,
        read: false,
        createdAt: timestamp,
        link: '/admin-console'
      };
      await setDoc(doc(db, 'approvalNotifications', notifId), notif);
    };

    // 1. Notify Applicant
    if (approval.submittedBy.uid) {
      const applicantMsg = `Your approval request for "${approval.entityName}" (${approval.approvalType}) has been marked as "${action}" by administrator ${admin.displayName}. Reason: ${reason}`;
      await dispatchNotification(
        approval.submittedBy.uid,
        `Approval Status Update: ${action}`,
        applicantMsg,
        action === 'Reject' ? 'high' : 'normal'
      );
    }

    // 2. Notify Business Owner (if separate from applicant)
    if (approval.business && approval.submittedBy.uid !== approval.business.id) {
      const ownerMsg = `Approval request on behalf of business "${approval.business.name}" has been updated: Action: ${action}. Reason: ${reason}`;
      await dispatchNotification(
        approval.business.id,
        `Business Approval Update: ${approval.entityName}`,
        ownerMsg,
        'normal'
      );
    }

    // 3. Notify Assigned Reviewer
    if (reviewer && reviewer.uid) {
      const reviewerMsg = `You have been assigned to review approval request "${approval.entityName}" (${approval.approvalType}).`;
      await dispatchNotification(
        reviewer.uid,
        `New Review Task Assigned`,
        reviewerMsg,
        'normal'
      );
    }

    // 4. Notify Platform Owner (High priority and critical only)
    if (approval.priority === 'High' || approval.priority === 'Critical') {
      const platformOwnerUid = 'akhileshs68'; // Platform Owner
      const ownerMsg = `CRITICAL ESCALATION / HIGH PRIORITY: Approval request "${approval.entityName}" has triggered a high priority action "${action}". Reason: ${reason}`;
      await dispatchNotification(
        platformOwnerUid,
        `HIGH PRIORITY ALERT: ${approval.entityName}`,
        ownerMsg,
        'high'
      );
    }
  }

  /**
   * Fetch immutable Audit Logs.
   */
  public async getAuditLogs(limitVal: number = 50): Promise<ApprovalAuditLog[]> {
    const q = query(
      this.getAuditLogsCollection(),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitVal)
    );
    const snap = await getDocs(q);
    const logs: ApprovalAuditLog[] = [];
    snap.forEach(d => {
      logs.push({ id: d.id, ...d.data() } as ApprovalAuditLog);
    });
    return logs;
  }

  /**
   * Compute state-based dashboards with total metrics and safety checks.
   */
  public async getDashboardMetrics(): Promise<{
    pending: number;
    approvedToday: number;
    rejectedToday: number;
    needChanges: number;
    onHold: number;
    highPriority: number;
    overdue: number;
    avgApprovalTimeMin: number;
  }> {
    const approvalsRef = this.getCollection();
    const snap = await getDocs(approvalsRef);
    
    let pending = 0;
    let approvedToday = 0;
    let rejectedToday = 0;
    let needChanges = 0;
    let onHold = 0;
    let highPriority = 0;
    let overdue = 0;
    let totalApprovalTimeMs = 0;
    let approvedCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    snap.forEach(docSnap => {
      const item = docSnap.data() as UniversalApproval;
      
      // Filter counts
      if (item.status === 'Pending Review' || item.status === 'Under Review' || item.status === 'Submitted') {
        pending++;
      }
      if (item.status === 'Need Changes') {
        needChanges++;
      }
      if (item.status === 'On Hold') {
        onHold++;
      }
      if (item.priority === 'High' || item.priority === 'Critical') {
        highPriority++;
      }

      // Check dates
      const createdDate = new Date(item.createdAt);
      const updatedDate = new Date(item.updatedAt);

      if (item.status === 'Approved') {
        approvedCount++;
        totalApprovalTimeMs += (updatedDate.getTime() - createdDate.getTime());
        if (item.updatedAt.startsWith(todayStr)) {
          approvedToday++;
        }
      }
      if (item.status === 'Rejected') {
        if (item.updatedAt.startsWith(todayStr)) {
          rejectedToday++;
        }
      }

      // Overdue check: open for more than 48 hours
      const diffHrs = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      if ((item.status === 'Pending Review' || item.status === 'Under Review' || item.status === 'Submitted') && diffHrs > 48) {
        overdue++;
      }
    });

    const avgApprovalTimeMin = approvedCount > 0 
      ? Math.round(totalApprovalTimeMs / (1000 * 60 * approvedCount)) 
      : 15; // default simulation

    return {
      pending,
      approvedToday,
      rejectedToday,
      needChanges,
      onHold,
      highPriority,
      overdue,
      avgApprovalTimeMin
    };
  }

  /**
   * Seed pristine initial records representing all 16 distinct approval queues.
   * Ensures the system is instantly production-ready with illustrative real-life data.
   */
  public async seedSampleApprovals(): Promise<void> {
    const db = getFirebaseDb();
    const colRef = this.getCollection();
    const snap = await getDocs(query(colRef, firestoreLimit(1)));
    if (!snap.empty) {
      return; // Already seeded
    }

    const types: ApprovalType[] = [
      'Business Registration',
      'Store Registration',
      'Product Approval',
      'Service Approval',
      'Banner Campaign Approval',
      'Advertisement Approval',
      'Featured Product Approval',
      'Featured Store Approval',
      'Seller Verification',
      'Merchant Verification',
      'Withdrawal Requests',
      'Refund Requests',
      'BMP Mint Requests',
      'BMP Burn Requests',
      'Dispute Resolution Queue',
      'Report / Appeal Queue'
    ];

    const entityNames = [
      'Global Pi Logistics Ltd',
      'Pioneer Tech Superstore',
      'Pi-Card Premium Subscriptions',
      'Web3 Custom Smart Contract Auditing',
      'Banner: Pi Independence Day Festival Ad',
      'Ad: Save 25% on Pi Mining Gear',
      'Premium PiMiner Hardware Suite',
      'Alpha Pi Electronics Outlet',
      'Alice Cooper (Certified Dev/Author)',
      'Global Merchants Syndicate Inc',
      'Withdrawal: 15,000 Pi to Cold Wallet',
      'Refund: Order #PI-9908 - Damaged Item',
      'BMP Mint: 250,000 BMP for Stakeholders',
      'BMP Burn: 50,000 BMP from Transaction Fees',
      'Dispute: Escrow Conflict #DIS-8809',
      'Appeal: Flagged Inappropriate Ad Report'
    ];

    const submitters = [
      { name: 'John Doe', uid: 'pi_pioneer_john', email: 'john@pinetwork.com' },
      { name: 'Sarah Connor', uid: 'pi_pioneer_sarah', email: 'connor@tech.org' },
      { name: 'Robert Downey', uid: 'pi_pioneer_robert', email: 'robert@marvel.co' },
      { name: 'Bruce Wayne', uid: 'pi_pioneer_bruce', email: 'wayne@gotham.org' },
      { name: 'Clark Kent', uid: 'pi_pioneer_clark', email: 'clark@dailyplanet.com' },
      { name: 'Lois Lane', uid: 'pi_pioneer_lois', email: 'lois@dailyplanet.com' },
      { name: 'Tony Stark', uid: 'pi_pioneer_tony', email: 'stark@starkindustries.com' },
      { name: 'Peter Parker', uid: 'pi_pioneer_peter', email: 'spidey@bugle.com' },
      { name: 'Diana Prince', uid: 'pi_pioneer_diana', email: 'diana@amazon.com' },
      { name: 'Barry Allen', uid: 'pi_pioneer_barry', email: 'flash@star.com' },
      { name: 'Arthur Curry', uid: 'pi_pioneer_arthur', email: 'aquaman@atlantis.com' },
      { name: 'Victor Stone', uid: 'pi_pioneer_victor', email: 'cyborg@starlabs.com' },
      { name: 'Hal Jordan', uid: 'pi_pioneer_hal', email: 'lantern@coastcity.org' },
      { name: 'Oliver Queen', uid: 'pi_pioneer_oliver', email: 'queen@starling.com' },
      { name: 'Selina Kyle', uid: 'pi_pioneer_selina', email: 'cat@gotham.org' },
      { name: 'Wade Wilson', uid: 'pi_pioneer_wade', email: 'pool@dead.com' }
    ];

    const priorities: ApprovalPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    const statuses: ApprovalStatus[] = ['Pending Review', 'Under Review', 'On Hold', 'Need Changes', 'Approved'];

    for (let i = 0; i < types.length; i++) {
      const id = `APP_CENTRAL_${i + 1}`;
      const approvalType = types[i];
      const entityName = entityNames[i];
      const sub = submitters[i % submitters.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      const riskScore = Math.floor(Math.random() * 85);

      const createdDate = new Date(Date.now() - (i * 3 + 1) * 3600 * 1000).toISOString();
      const updatedDate = new Date(Date.now() - (i * 1.5) * 3600 * 1000).toISOString();

      const item: UniversalApproval = {
        id,
        approvalType,
        entityId: `ENT_REF_${1000 + i}`,
        entityName,
        submittedBy: {
          uid: sub.uid,
          name: sub.name,
          email: sub.email
        },
        business: {
          id: `BUS_${200 + i}`,
          name: `${entityName.split(' ')[0]} Enterprise`
        },
        store: {
          id: `STR_${300 + i}`,
          name: `${entityName.split(' ')[0]} Retail Center`
        },
        category: 'Enterprise Node Governance',
        status,
        createdAt: createdDate,
        updatedAt: updatedDate,
        priority,
        riskScore,
        paymentStatus: i % 3 === 0 ? 'Paid' : i % 3 === 1 ? 'Pending' : 'N/A',
        verificationStatus: i % 2 === 0 ? 'Verified' : 'Pending',
        attachments: [
          { name: 'Government_Business_License.pdf', url: 'https://pinetwork.com/assets/license.pdf', type: 'application/pdf' },
          { name: 'AML_Risk_Compliance_Form.png', url: 'https://pinetwork.com/assets/compliance.png', type: 'image/png' }
        ],
        comments: [
          {
            commentId: `COM_${100 + i}`,
            authorUid: 'sys_bot',
            authorName: 'Compliance Guard Bot',
            content: `Automated analysis passed. Risk Score evaluates to ${riskScore}. System ready for platform administrator review.`,
            timestamp: createdDate
          }
        ],
        historyTimeline: [
          {
            eventId: `HIST_${1000 + i}`,
            action: 'Submit',
            oldStatus: 'Draft',
            newStatus: 'Submitted',
            adminUid: sub.uid,
            adminName: sub.name,
            reason: 'Initial portal submission of governance request.',
            timestamp: createdDate
          },
          {
            eventId: `HIST_${2000 + i}`,
            action: 'Resume',
            oldStatus: 'Submitted',
            newStatus: 'Pending Review',
            adminUid: 'compliance_officer',
            adminName: 'Compliance Officer',
            reason: 'Queued to universal console queue.',
            timestamp: updatedDate
          }
        ],
        assignedReviewer: status === 'Under Review' ? { uid: 'reviewer_bob', name: 'Reviewer Bob' } : undefined,
        entityPreview: {
          piAddress: 'GD5R...Y3UI',
          testnetBmpAmount: i % 2 === 0 ? 50000 : 0,
          requestedEscrowPi: i * 150 + 25
        }
      };

      await setDoc(doc(db, 'universalApprovals', id), item);
    }
  }
}

export const approvalService = ApprovalService.getInstance();
