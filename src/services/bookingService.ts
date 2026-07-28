import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { UniversalBooking } from '../types/order';

export const bookingService = {
  async createBooking(bookingData: any): Promise<string> {
    const db = getFirebaseDb();
    const itemRef = doc(collection(db, 'bookings'));
    const id = itemRef.id;
    
    await setDoc(itemRef, {
      ...bookingData,
      id,
      type: 'booking',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  },

  async updateBookingStatus(id: string, status: string): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'bookings', id);
    await updateDoc(itemRef, {
      bookingStatus: status,
      updatedAt: serverTimestamp(),
    });
  },

  async getBookingsBySeller(sellerId: string) {
    const db = getFirebaseDb();
    const q = query(collection(db, 'bookings'), where('sellerId', '==', sellerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getBookingsByBuyer(buyerId: string) {
    const db = getFirebaseDb();
    const q = query(collection(db, 'bookings'), where('buyerId', '==', buyerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
