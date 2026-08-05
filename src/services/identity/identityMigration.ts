/**
 * Zero-Downtime Data Migration Engine
 * Automatically migrates existing user data and relationships from a legacy
 * Firebase UID (device-specific anonymous ID) to a canonical Pi UID identity.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

export class IdentityMigration {
  /**
   * Run the zero-downtime identity migration process
   */
  public async migrateLegacyData(legacyFirebaseUid: string, canonicalPiUid: string): Promise<void> {
    if (!legacyFirebaseUid || !canonicalPiUid || legacyFirebaseUid === canonicalPiUid) {
      return;
    }

    console.log(`[IdentityMigration] Starting zero-downtime migration from legacy Firebase UID: ${legacyFirebaseUid} to canonical Pi UID: ${canonicalPiUid}`);
    const db = getFirebaseDb();

    try {
      // 1. Migrate Wallets
      await this.migrateWallets(db, legacyFirebaseUid, canonicalPiUid);

      // 2. Migrate Businesses & businessMembers
      await this.migrateBusinesses(db, legacyFirebaseUid, canonicalPiUid);

      // 3. Migrate Stores, Products, Services
      await this.migrateStoresProductsServices(db, legacyFirebaseUid, canonicalPiUid);

      // 4. Migrate Orders, orderItems, checkoutSessions
      await this.migrateOrdersAndCheckout(db, legacyFirebaseUid, canonicalPiUid);

      // 5. Migrate Payments, receipts, disputes
      await this.migratePaymentsReceiptsDisputes(db, legacyFirebaseUid, canonicalPiUid);

      // 6. Migrate Notifications
      await this.migrateNotifications(db, legacyFirebaseUid, canonicalPiUid);

      // 7. Migrate Conversations & messages
      await this.migrateConversations(db, legacyFirebaseUid, canonicalPiUid);

      // 8. Mark old users/{firebaseUid} document as migrated
      await this.markLegacyUserAsMigrated(db, legacyFirebaseUid, canonicalPiUid);

      console.log(`[IdentityMigration] Completed zero-downtime migration from ${legacyFirebaseUid} to ${canonicalPiUid} successfully.`);
    } catch (error) {
      console.error(`[IdentityMigration] Error migrating legacy data for ${legacyFirebaseUid}:`, error);
    }
  }

  private async migrateWallets(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    const walletTypes = ['bmp_rewards', 'pi_testnet', 'business'];
    for (const type of walletTypes) {
      const oldDocId = `${legacyUid}_${type}`;
      const newDocId = `${canonicalUid}_${type}`;

      const oldRef = doc(db, 'wallets', oldDocId);
      const newRef = doc(db, 'wallets', newDocId);

      try {
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists()) {
          const oldData = oldSnap.data();
          const newSnap = await getDoc(newRef);

          if (newSnap.exists()) {
            // Merge balance
            const newData = newSnap.data();
            const oldBalance = parseFloat(oldData.balance || 0);
            const newBalance = parseFloat(newData.balance || 0);
            const oldLocked = parseFloat(oldData.lockedBalance || 0);
            const newLocked = parseFloat(newData.lockedBalance || 0);

            await setDoc(newRef, {
              balance: newBalance + oldBalance,
              lockedBalance: newLocked + oldLocked,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else {
            // Create new wallet using old data, but mapping UIDs
            await setDoc(newRef, {
              ...oldData,
              userId: canonicalUid,
              userUid: canonicalUid,
              id: newDocId,
              updatedAt: serverTimestamp()
            });
          }

          // Mark old wallet as migrated
          await setDoc(oldRef, {
            status: 'migrated',
            migratedTo: canonicalUid,
            balance: 0,
            lockedBalance: 0,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.warn(`[IdentityMigration] Wallet migration failed for type ${type}:`, err);
      }
    }

    // Migrate master_wallets
    try {
      const oldMasterRef = doc(db, 'master_wallets', legacyUid);
      const newMasterRef = doc(db, 'master_wallets', canonicalUid);
      const oldMasterSnap = await getDoc(oldMasterRef);
      if (oldMasterSnap.exists()) {
        const oldMasterData = oldMasterSnap.data();
        const newMasterSnap = await getDoc(newMasterRef);

        if (newMasterSnap.exists()) {
          const newMasterData = newMasterSnap.data();
          const oldBal = parseFloat(oldMasterData.piTestnetBalance || 0);
          const newBal = parseFloat(newMasterData.piTestnetBalance || 0);
          const oldBmp = parseFloat(oldMasterData.bmpBalance || 0);
          const newBmp = parseFloat(newMasterData.bmpBalance || 0);

          await setDoc(newMasterRef, {
            piTestnetBalance: newBal + oldBal,
            bmpBalance: newBmp + oldBmp,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          await setDoc(newMasterRef, {
            ...oldMasterData,
            userId: canonicalUid,
            updatedAt: serverTimestamp()
          });
        }

        await setDoc(oldMasterRef, {
          status: 'migrated',
          migratedTo: canonicalUid,
          piTestnetBalance: 0,
          bmpBalance: 0,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('[IdentityMigration] Master wallet migration failed:', err);
    }
  }

  private async migrateBusinesses(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      // Update businesses collection where ownerUid == legacyUid
      const businessesQ = query(collection(db, 'businesses'), where('ownerUid', '==', legacyUid));
      const businessesSnap = await getDocs(businessesQ);
      const batch = writeBatch(db);
      let count = 0;

      for (const d of businessesSnap.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Update businessMembers where userUid == legacyUid
      const membersQ = query(collection(db, 'businessMembers'), where('userUid', '==', legacyUid));
      const membersSnap = await getDocs(membersQ);

      for (const d of membersSnap.docs) {
        const data = d.data();
        const businessId = data.businessId;
        if (businessId) {
          const newMemberRef = doc(db, 'businessMembers', `${businessId}_${canonicalUid}`);
          batch.set(newMemberRef, {
            ...data,
            memberId: `${businessId}_${canonicalUid}`,
            userUid: canonicalUid,
            updatedAt: serverTimestamp()
          });
          batch.delete(d.ref);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Business migration failed:', err);
    }
  }

  private async migrateStoresProductsServices(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Migrate Stores where ownerUid matches
      const storesQ = query(collection(db, 'stores'), where('ownerUid', '==', legacyUid));
      const storesSnap = await getDocs(storesQ);
      for (const d of storesSnap.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          userId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Migrate Stores where userId matches
      const storesQ2 = query(collection(db, 'stores'), where('userId', '==', legacyUid));
      const storesSnap2 = await getDocs(storesQ2);
      for (const d of storesSnap2.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          userId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Migrate Products where ownerUid matches
      const productsQ = query(collection(db, 'products'), where('ownerUid', '==', legacyUid));
      const productsSnap = await getDocs(productsQ);
      for (const d of productsSnap.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Migrate Products where sellerId matches
      const productsQ2 = query(collection(db, 'products'), where('sellerId', '==', legacyUid));
      const productsSnap2 = await getDocs(productsQ2);
      for (const d of productsSnap2.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Migrate Services where ownerUid matches
      const servicesQ = query(collection(db, 'services'), where('ownerUid', '==', legacyUid));
      const servicesSnap = await getDocs(servicesQ);
      for (const d of servicesSnap.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      // Migrate Services where sellerId matches
      const servicesQ2 = query(collection(db, 'services'), where('sellerId', '==', legacyUid));
      const servicesSnap2 = await getDocs(servicesQ2);
      for (const d of servicesSnap2.docs) {
        batch.update(d.ref, {
          ownerUid: canonicalUid,
          ownerId: canonicalUid,
          sellerId: canonicalUid,
          updatedAt: serverTimestamp()
        });
        count++;
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Stores/Products/Services migration failed:', err);
    }
  }

  private async migrateOrdersAndCheckout(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Migrate Orders
      const orderFields = ['buyerId', 'sellerId', 'userUid', 'businessId'];
      for (const field of orderFields) {
        const q = query(collection(db, 'orders'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = { updatedAt: serverTimestamp() };
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      // Migrate orderItems
      const orderItemFields = ['buyerId', 'sellerId', 'userUid'];
      for (const field of orderItemFields) {
        const q = query(collection(db, 'orderItems'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = {};
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      // Migrate checkoutSessions
      const checkoutFields = ['buyerId', 'sellerId', 'userUid'];
      for (const field of checkoutFields) {
        const q = query(collection(db, 'checkoutSessions'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = { updatedAt: serverTimestamp() };
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Orders migration failed:', err);
    }
  }

  private async migratePaymentsReceiptsDisputes(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Payments
      const paymentFields = ['uid', 'userId', 'buyerId', 'sellerId'];
      for (const field of paymentFields) {
        const q = query(collection(db, 'payments'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = { updatedAt: serverTimestamp() };
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      // Receipts
      const receiptFields = ['buyerId', 'sellerId', 'userUid'];
      for (const field of receiptFields) {
        const q = query(collection(db, 'receipts'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = {};
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      // Disputes
      const disputeFields = ['buyerId', 'sellerId', 'userUid'];
      for (const field of disputeFields) {
        const q = query(collection(db, 'disputes'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = { updatedAt: serverTimestamp() };
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Payments/Receipts/Disputes migration failed:', err);
    }
  }

  private async migrateNotifications(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      let count = 0;

      const notifFields = ['recipientUid', 'senderUid'];
      for (const field of notifFields) {
        const q = query(collection(db, 'notifications'), where(field, '==', legacyUid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const updateObj: any = {};
          updateObj[field] = canonicalUid;
          batch.update(d.ref, updateObj);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Notifications migration failed:', err);
    }
  }

  private async migrateConversations(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', legacyUid));
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const batch = writeBatch(db);
        const data = d.data();
        const participants: string[] = data.participants || [];
        const updatedParticipants = participants.map(p => p === legacyUid ? canonicalUid : p);

        const unreadCounts = data.unreadCounts || {};
        const updatedUnreadCounts: any = {};
        Object.entries(unreadCounts).forEach(([k, v]) => {
          if (k === legacyUid) {
            updatedUnreadCounts[canonicalUid] = v;
          } else {
            updatedUnreadCounts[k] = v;
          }
        });

        batch.update(d.ref, {
          participants: updatedParticipants,
          unreadCounts: updatedUnreadCounts,
          updatedAt: serverTimestamp()
        });

        // Query subcollection messages
        const msgQ = query(collection(db, 'conversations', d.id, 'messages'), where('senderUid', '==', legacyUid));
        const msgSnap = await getDocs(msgQ);
        for (const msgDoc of msgSnap.docs) {
          batch.update(msgDoc.ref, {
            senderUid: canonicalUid
          });
        }

        await batch.commit();
      }
    } catch (err) {
      console.warn('[IdentityMigration] Conversations migration failed:', err);
    }
  }

  private async markLegacyUserAsMigrated(db: any, legacyUid: string, canonicalUid: string): Promise<void> {
    try {
      const legacyUserRef = doc(db, 'users', legacyUid);
      const legacyUserSnap = await getDoc(legacyUserRef);
      if (legacyUserSnap.exists()) {
        await updateDoc(legacyUserRef, {
          status: 'migrated',
          migratedTo: canonicalUid,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('[IdentityMigration] Failed to mark legacy user document as migrated:', err);
    }
  }
}

export const identityMigration = new IdentityMigration();
