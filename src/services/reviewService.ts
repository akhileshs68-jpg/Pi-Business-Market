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
  serverTimestamp, 
  updateDoc,
  writeBatch,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Review, 
  ReputationScore, 
  ReviewEntityType, 
  ReviewStatus,
  ReviewVote,
  ReviewReport
} from '../types';
import { crmService } from './crmService';
import { notificationService } from './notificationService';
import { businessService } from './businessService';

export const reviewService = {
  /**
   * SUBMIT REVIEW
   * Uses a transaction to update review and aggregate reputation score
   */
  async submitReview(review: Omit<Review, 'reviewId' | 'status' | 'helpfulCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseDb();
    const reviewId = `REV_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    // Check for duplicate verified review
    if (review.orderId) {
      const q = query(
        collection(db, 'reviews'), 
        where('orderId', '==', review.orderId), 
        where('entityId', '==', review.entityId),
        where('reviewerUid', '==', review.reviewerUid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('You have already reviewed this item for this order.');
      }
    }

    await runTransaction(db, async (transaction) => {
      // 1. Create Review
      const reviewRef = doc(db, 'reviews', reviewId);
      transaction.set(reviewRef, {
        ...review,
        reviewId,
        status: 'published', // Auto-publish for foundation
        helpfulCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Update Reputation Score
      const reputationRef = doc(db, 'reputationScores', review.entityId);
      const repSnap = await transaction.get(reputationRef);

      if (!repSnap.exists()) {
        transaction.set(reputationRef, {
          entityId: review.entityId,
          entityType: review.entityType,
          overallRating: review.rating,
          reviewCount: 1,
          verifiedReviewCount: review.verifiedPurchase ? 1 : 0,
          trustScore: 80, // Initial trust score
          lastUpdated: serverTimestamp()
        });
      } else {
        const data = repSnap.data() as ReputationScore;
        const newCount = data.reviewCount + 1;
        const newRating = ((data.overallRating * data.reviewCount) + review.rating) / newCount;
        
        transaction.update(reputationRef, {
          overallRating: newRating,
          reviewCount: increment(1),
          verifiedReviewCount: review.verifiedPurchase ? increment(1) : increment(0),
          lastUpdated: serverTimestamp()
        });
      }
    });

    // CRM Integration
    try {
      const businessId = review.businessId;
      const business = await businessService.getBusiness(businessId);
      
      if (business) {
        // Notify Business Owner
        await notificationService.notify(
          business.ownerUid,
          'review_reply', // or new_review if we had that type, using review_reply as placeholder or system_alert
          'New Review Posted',
          `${review.reviewerName} gave you a ${review.rating}-star review for ${review.entityType}.`,
          { entityType: 'review', entityId: reviewId, priority: 'medium', linkTo: `/dashboard/reviews` }
        );
      }

      const customer = await crmService.getOrCreateCustomer(review.reviewerUid, businessId, review.reviewerName, '');
      await crmService.recordActivity(
        customer.customerId,
        businessId,
        'review_submitted',
        'Review Submitted',
        `You submitted a ${review.rating}-star review for a ${review.entityType}.`,
        reviewId
      );
    } catch (err) {
      console.error('CRM/Notification review tracking failed', err);
    }

    return reviewId;
  },

  /**
   * RETRIEVAL
   */
  async getEntityReviews(entityId: string): Promise<Review[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'reviews'),
      where('entityId', '==', entityId)
    );
    const snapshot = await getDocs(q);
    let reviews = snapshot.docs.map(doc => this.mapDocToReview(doc));
    
    return reviews
      .filter(r => r.status === 'published')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getEntityReputation(entityId: string): Promise<ReputationScore | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'reputationScores', entityId));
    if (!snap.exists()) return null;
    return this.mapDocToReputation(snap);
  },

  /**
   * FEEDBACK & MODERATION
   */
  async voteHelpful(reviewId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const voteId = `${reviewId}_${userUid}`;
    const voteRef = doc(db, 'reviewVotes', voteId);
    
    const voteSnap = await getDoc(voteRef);
    if (voteSnap.exists()) return; // Prevent double voting

    const batch = writeBatch(db);
    batch.set(voteRef, {
      voteId,
      reviewId,
      userUid,
      type: 'helpful',
      createdAt: serverTimestamp()
    });
    batch.update(doc(db, 'reviews', reviewId), {
      helpfulCount: increment(1)
    });
    await batch.commit();
  },

  async reportReview(report: Omit<ReviewReport, 'reportId' | 'status' | 'createdAt'>): Promise<void> {
    const db = getFirebaseDb();
    const reportId = `REP_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    await setDoc(doc(db, 'reviewReports', reportId), {
      ...report,
      reportId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  },

  /**
   * MERCHANT REPLY
   */
  async replyToReview(reviewId: string, comment: string, replierName: string): Promise<void> {
    const db = getFirebaseDb();
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      reply: {
        comment,
        repliedAt: new Date().toISOString(),
        replierName
      },
      updatedAt: serverTimestamp()
    });

    // Notify Customer of Reply
    try {
      const snap = await getDoc(reviewRef);
      if (snap.exists()) {
        const review = snap.data() as Review;
        await notificationService.notify(
          review.reviewerUid,
          'review_reply',
          'Merchant Replied to Your Review',
          `${replierName} responded: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
          { entityType: 'review', entityId: reviewId, priority: 'low' }
        );
      }
    } catch (notifErr) {
      console.error('Review reply notification failed', notifErr);
    }
  },

  /**
   * HELPERS
   */
  mapDocToReview(doc: any): Review {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Review;
  },

  mapDocToReputation(doc: any): ReputationScore {
    const data = doc.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
    } as ReputationScore;
  }
};
