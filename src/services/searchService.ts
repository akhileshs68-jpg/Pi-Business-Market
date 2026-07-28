
function calculateScore(pattern: string, text: string): number {
  if (!pattern || !text) return 0;
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  if (text === pattern) return 100;
  if (text.startsWith(pattern)) return 80;
  if (text.includes(pattern)) return 60;
  let pIdx = 0, tIdx = 0, matches = 0;
  while (pIdx < pattern.length && tIdx < text.length) {
    if (pattern[pIdx] === text[tIdx]) { matches++; pIdx++; }
    tIdx++;
  }
  if (matches === pattern.length) return 40;
  let overlap = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (text.includes(pattern[i])) overlap++;
  }
  if (overlap / pattern.length > 0.7) return 20;
  return 0;
}
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
  limit,
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { SearchIndexEntry, SearchFilters, SearchEntityType } from '../types';
import { analyticsService } from './analyticsService';

export const searchService = {
  /**
   * INDEX MANAGEMENT
   */
  async indexEntity(entry: Omit<SearchIndexEntry, 'documentId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = getFirebaseDb();
    const documentId = `${entry.entityType}_${entry.entityId}`;
    
    await setDoc(doc(db, 'searchIndex', documentId), {
      ...entry,
      documentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  async deleteFromIndex(entityType: SearchEntityType, entityId: string): Promise<void> {
    const db = getFirebaseDb();
    const documentId = `${entityType}_${entityId}`;
    await updateDoc(doc(db, 'searchIndex', documentId), {
      status: 'deleted',
      visibility: 'private',
      updatedAt: serverTimestamp()
    });
  },

  /**
   * GLOBAL SEARCH ENGINE
   */


  async search(
    keyword: string, 
    filters: SearchFilters = {}, 
    pageSize: number = 20,
    lastDoc?: any
  ): Promise<{ results: SearchIndexEntry[], lastVisible: any }> {
    const db = getFirebaseDb();
    let results: SearchIndexEntry[] = [];
    
    // ==========================================
    // DEBUGGING AUDIT - FIREBASE TO UI
    // ==========================================
    console.log('[Search Debug] Starting search for:', keyword);
    const promises = [];
    
    // Products
    if (!filters.entityType || filters.entityType === 'product') {
      promises.push(getDocs(collection(db, 'products'))
        .then(snap => {
          console.log('[Search Debug] Products returned:', snap.size);
          snap.forEach(d => {
            const p = d.data();
            if (p.status === 'published' || !p.status) {
              results.push({
                documentId: `product_${p.productId || d.id}`,
                entityType: 'product',
                entityId: p.productId || d.id,
                businessId: p.businessId,
                storeId: p.storeId,
                title: p.productName || p.name || p.title || '',
                description: p.shortDescription || p.description || '',
                keywords: [p.brand || '', p.category || '', ...(p.tags || [])].filter(Boolean),
                categoryIds: [p.category || ''],
                visibility: 'public',
                status: 'published',
                price: p.basePrice,
                currency: p.currency,
                featured: false,
                metadata: {},
                createdAt: p.createdAt,
                updatedAt: p.updatedAt
              });
            } else {
              console.log('[Search Debug] Filtered out product:', p.productName, 'Reason: status =', p.status);
            }
          });
        }));
    }

    // Businesses
    if (!filters.entityType || filters.entityType === 'business') {
      promises.push(getDocs(collection(db, 'businesses'))
        .then(snap => {
          console.log('[Search Debug] Businesses returned:', snap.size);
          snap.forEach(d => {
            const b = d.data();
            
            let pass = b.businessStatus !== 'archived';
            if (pass && filters.businessType) {
              pass = b.businessType === filters.businessType;
            }
            if (pass && filters.isVerified !== undefined) {
              pass = (b.verificationStatus === 'Verified') === filters.isVerified;
            }
            if (pass && filters.minRating !== undefined) {
              pass = (b.rating || 0) >= filters.minRating;
            }
            if (pass) {

              results.push({
                documentId: `business_${b.id || d.id}`,
                entityType: 'business',
                entityId: b.id || d.id,
                businessId: b.id,
                title: b.displayName || b.businessName || b.name || b.title || '',
                description: b.description || b.industry || '',
                keywords: [b.industry || '', b.category || '', b.ownerUid || ''].filter(Boolean),
                categoryIds: [b.category || ''],
                visibility: 'public',
                status: 'published',
                featured: false,
                metadata: {},
                createdAt: b.createdAt,
                updatedAt: b.updatedAt
              });
            } else {
              console.log('[Search Debug] Filtered out business:', b.businessName, 'Reason: businessStatus =', b.businessStatus);
            }
          });
        }));
    }

    // Stores
    if (!filters.entityType || filters.entityType === 'store') {
      promises.push(getDocs(collection(db, 'stores'))
        .then(snap => {
          console.log('[Search Debug] Stores returned:', snap.size);
          snap.forEach(d => {
            const s = d.data();
            console.log('[Search Debug] Store DB entry:', { id: d.id, name: s.storeName, status: s.status, visibility: s.visibility });
            
            // Allow active, pending, or undefined status just to be safe
            if (s.status !== 'archived' && s.status !== 'deleted') {
              results.push({
                documentId: `store_${s.storeId || d.id}`,
                entityType: 'store',
                entityId: s.storeId || d.id,
                businessId: s.businessId,
                title: s.storeName || s.name || s.displayName || s.title || '',
                description: s.description || s.storeType || '',
                keywords: [s.storeType || '', s.storeCategory || ''].filter(Boolean),
                categoryIds: [s.storeCategory || ''],
                visibility: 'public',
                status: 'published',
                featured: false,
                metadata: {},
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
              });
            } else {
              console.log('[Search Debug] Filtered out store:', s.storeName, 'Reason: status =', s.status);
            }
          });
        }));
    }

    // Services
    if (!filters.entityType || filters.entityType === 'service') {
      promises.push(getDocs(collection(db, 'services'))
        .then(snap => {
          console.log('[Search Debug] Services returned:', snap.size);
          snap.forEach(d => {
            const s = d.data();
            if (s.status !== 'archived' && s.status !== 'deleted') {
              results.push({
                documentId: `service_${s.serviceId || d.id}`,
                entityType: 'service',
                entityId: s.serviceId || d.id,
                businessId: s.businessId,
                title: s.title || s.name || s.serviceName || '',
                description: s.description || '',
                keywords: [s.category || '', s.subCategory || '', s.locationType || ''].filter(Boolean),
                categoryIds: [s.category || ''],
                location: s.serviceArea,
                visibility: 'public',
                status: 'published',
                price: s.basePrice,
                currency: s.currency,
                featured: false,
                metadata: {},
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
              });
            }
          });
        }));
    }

    // Jobs
    if (!filters.entityType || filters.entityType === 'job') {
      promises.push(getDocs(collection(db, 'jobs'))
        .then(snap => {
          console.log('[Search Debug] Jobs returned:', snap.size);
          snap.forEach(d => {
            const j = d.data();
            if (j.status !== 'archived' && j.status !== 'deleted') {
              results.push({
                documentId: `job_${j.jobId || d.id}`,
                entityType: 'job',
                entityId: j.jobId || d.id,
                businessId: j.businessId,
                title: j.title || j.name || j.jobTitle || '',
                description: j.department || '',
                keywords: [j.department || '', j.employmentType || '', j.workMode || '', j.experienceLevel || ''].filter(Boolean),
                categoryIds: [j.department || ''],
                location: j.workMode === 'remote' ? 'Remote' : 'On-site',
                visibility: 'public',
                status: 'published',
                price: j.salaryMin,
                currency: j.currency,
                featured: false,
                metadata: {},
                createdAt: j.createdAt,
                updatedAt: j.updatedAt
              });
            }
          });
        }));
    }

    await Promise.all(promises);
    console.log('[Search Debug] Total raw items across collections:', results.length);

    // Apply Filters
    if (filters.businessId) {
      results = results.filter(r => r.businessId === filters.businessId);
    }
    if (filters.categoryId) {
      results = results.filter(r => r.categoryIds?.includes(filters.categoryId!));
    }

    if (keyword) {
      const lowerKw = keyword.toLowerCase();
      console.log(`[Search Debug] Calculating fuzzy scores for "${lowerKw}"`);
      
      const scoredResults = results.map(item => {
        let maxScore = 0;
        
        // Exact matching and startsWith are handled by calculateScore
        const titleScore = calculateScore(lowerKw, item.title);
        maxScore = Math.max(maxScore, titleScore);
        
        if (item.description) {
          maxScore = Math.max(maxScore, calculateScore(lowerKw, item.description) * 0.8);
        }
        
        if (item.keywords && item.keywords.length > 0) {
          item.keywords.forEach(k => {
            maxScore = Math.max(maxScore, calculateScore(lowerKw, k) * 0.9);
          });
        }
        
        console.log(`[Search Debug] Item: "${item.title}" | Type: ${item.entityType} | Score: ${maxScore}`);
        return { item, score: maxScore };
      });
      
      results = scoredResults
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
        
      console.log('[Search Debug] Items remaining after fuzzy filtering:', results.length);
    } else {
      results.sort((a, b) => {
        const da = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const db = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return db - da;
      });
    }

    if (pageSize) {
      results = results.slice(0, pageSize);
    }

    return {
      results,
      lastVisible: null
    };
  },

  /**
   * DISCOVERY HELPERS
   */
  async getFeatured(entityType?: SearchEntityType): Promise<SearchIndexEntry[]> {
    const db = getFirebaseDb();
    const constraints: QueryConstraint[] = [
      where('featured', '==', true),
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      limit(10)
    ];
    if (entityType) constraints.push(where('entityType', '==', entityType));

    const q = query(collection(db, 'searchIndex'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToEntry(doc));
  },

  /**
   * USER HISTORY
   */
  async recordSearch(userUid: string, queryText: string): Promise<void> {
    const db = getFirebaseDb();
    const searchId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'recentSearches', searchId), {
      searchId,
      userUid,
      query: queryText,
      timestamp: serverTimestamp()
    });

    // ANALYTICS
    await analyticsService.trackEvent({
      eventType: 'search_performed',
      userUid,
      metadata: { query: queryText }
    });
  },

  mapDocToEntry(doc: any): SearchIndexEntry {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as SearchIndexEntry;
  }
};
