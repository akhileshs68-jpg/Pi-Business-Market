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
    const constraints: QueryConstraint[] = [
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (filters.entityType) constraints.push(where('entityType', '==', filters.entityType));
    if (filters.businessId) constraints.push(where('businessId', '==', filters.businessId));
    if (filters.categoryId) constraints.push(where('categoryIds', 'array-contains', filters.categoryId));
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, 'searchIndex'), ...constraints);
    const snapshot = await getDocs(q);
    
    let results = snapshot.docs.map(doc => this.mapDocToEntry(doc));

    // Simple client-side text filtering if keyword is provided
    // In production, this would use a dedicated search engine like Algolia or ElasticSearch
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword) ||
        item.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
      );
    }

    return {
      results,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
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
