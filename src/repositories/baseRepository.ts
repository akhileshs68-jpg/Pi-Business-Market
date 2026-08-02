/**
 * Pi Business Market - Base Firestore Repository Pattern
 * Provides standardized, typed CRUD operations, caching, and error handling for all domain collections.
 */

import { getFirebaseDb } from '../firebase/config';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  collection, query, where, getDocs, limit, orderBy, QueryConstraint 
} from 'firebase/firestore';
import { AppError } from '../core/errors';
import { logger } from '../core/logger';

export abstract class BaseRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get single document by ID
   */
  public async getById(id: string): Promise<T | null> {
    try {
      const db = getFirebaseDb();
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as T;
      }
      return null;
    } catch (err: any) {
      logger.error('Repository', `Error reading ${this.collectionName}/${id}: ${err.message}`);
      throw new AppError('INTERNAL_ERROR', `Repository read error on ${this.collectionName}`);
    }
  }

  /**
   * Save or merge document
   */
  public async save(data: T): Promise<void> {
    try {
      const db = getFirebaseDb();
      const ref = doc(db, this.collectionName, data.id);
      await setDoc(ref, data, { merge: true });
    } catch (err: any) {
      logger.error('Repository', `Error saving ${this.collectionName}/${data.id}: ${err.message}`);
      throw new AppError('INTERNAL_ERROR', `Repository write error on ${this.collectionName}`);
    }
  }

  /**
   * Query documents with custom constraints
   */
  public async findWhere(...constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const db = getFirebaseDb();
      const colRef = collection(db, this.collectionName);
      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (err: any) {
      logger.error('Repository', `Query error on ${this.collectionName}: ${err.message}`);
      throw new AppError('INTERNAL_ERROR', `Repository query error on ${this.collectionName}`);
    }
  }
}
