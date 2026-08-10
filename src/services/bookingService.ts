import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { serviceMarketplaceService } from './serviceMarketplaceService';
import { notificationService } from './notificationService';

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

export const bookingService = {
  /**
   * CHECK SLOT AVAILABILITY & DOUBLE BOOKING PROTECTION
   */
  async checkSlotAvailability(
    serviceId: string,
    sellerId: string,
    bookingDate: string,
    bookingTime: string,
    excludeBookingId?: string
  ): Promise<{ available: boolean; existingBookingId?: string }> {
    const db = getFirebaseDb();
    
    // Query active bookings for the same date and time slot
    const q = query(
      collection(db, 'bookings'),
      where('bookingDate', '==', bookingDate),
      where('bookingTime', '==', bookingTime)
    );

    const snap = await getDocs(q);
    const conflictingDoc = snap.docs.find(d => {
      if (excludeBookingId && d.id === excludeBookingId) return false;
      const data = d.data();
      const sameService = data.serviceId === serviceId || data.sellerId === sellerId;
      const isActiveStatus = ['pending', 'confirmed', 'scheduled', 'rescheduled'].includes((data.bookingStatus || '').toLowerCase());
      return sameService && isActiveStatus;
    });

    if (conflictingDoc) {
      return { available: false, existingBookingId: conflictingDoc.id };
    }

    return { available: true };
  },

  /**
   * CREATE BOOKING WITH DOUBLE BOOKING PROTECTION
   */
  async createBooking(bookingData: any): Promise<string> {
    const db = getFirebaseDb();

    // 1. Double Booking Check
    if (bookingData.serviceId && bookingData.bookingDate && bookingData.bookingTime) {
      const slotCheck = await this.checkSlotAvailability(
        bookingData.serviceId,
        bookingData.sellerId || '',
        bookingData.bookingDate,
        bookingData.bookingTime
      );

      if (!slotCheck.available) {
        throw new Error(
          `SLOT_UNAVAILABLE: The time slot "${bookingData.bookingTime}" on ${bookingData.bookingDate} is already reserved by another client. Please choose another time slot.`
        );
      }
    }

    // 2. Persist Booking
    const itemRef = doc(collection(db, 'bookings'));
    const id = itemRef.id;
    
    const payload = {
      ...bookingData,
      id,
      type: 'booking',
      bookingStatus: bookingData.bookingStatus || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(itemRef, payload);

    // 3. Notify Service Provider
    if (bookingData.sellerId) {
      try {
        await notificationService.notify(
          bookingData.sellerId,
          'order_update',
          'New Service Booking Request!',
          `You have a new appointment request for "${bookingData.title}" on ${bookingData.bookingDate} at ${bookingData.bookingTime}.`,
          { entityType: 'booking', entityId: id, priority: 'high', linkTo: '/bookings' }
        );
      } catch (notifErr) {
        console.warn('[BookingService] Provider notification notice:', notifErr);
      }
    }

    return id;
  },

  /**
   * GENERATE DYNAMIC TIME SLOTS FOR A GIVEN DATE
   */
  async getAvailableTimeSlots(
    serviceId: string,
    sellerId: string,
    bookingDate: string
  ): Promise<TimeSlot[]> {
    const defaultSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '01:00 PM', '02:00 PM',
      '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    try {
      // Fetch availability config
      const avail = await serviceMarketplaceService.getAvailability(serviceId) ||
                    (sellerId ? await serviceMarketplaceService.getAvailability(sellerId) : null);

      if (avail) {
        // Check blackout dates
        const blackoutList = avail.blackoutDates || [];
        const holidayDates = (avail.holidayRules || []).map(h => h.date);
        if (blackoutList.includes(bookingDate) || holidayDates.includes(bookingDate)) {
          return defaultSlots.map(t => ({ time: t, isAvailable: false, reason: 'Provider on Leave / Date Blocked' }));
        }

        // Check working days (0 = Sunday, 1 = Monday ... 6 = Saturday)
        if (avail.workingDays && avail.workingDays.length > 0) {
          const dateObj = new Date(bookingDate);
          const dayIndex = dateObj.getDay();
          const isWorkingDay = avail.workingDays.includes(dayIndex);
          if (!isWorkingDay) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return defaultSlots.map(t => ({ time: t, isAvailable: false, reason: `Provider closed on ${dayNames[dayIndex]}s` }));
          }
        }
      }

      // Check existing booked slots
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'bookings'),
        where('bookingDate', '==', bookingDate)
      );
      const snap = await getDocs(q);

      const bookedTimes = new Set<string>();
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        if ((d.serviceId === serviceId || d.sellerId === sellerId) && 
            ['pending', 'confirmed', 'scheduled', 'rescheduled'].includes((d.bookingStatus || '').toLowerCase())) {
          if (d.bookingTime) bookedTimes.add(d.bookingTime.toUpperCase());
        }
      });

      return defaultSlots.map(t => {
        const isBooked = bookedTimes.has(t.toUpperCase());
        return {
          time: t,
          isAvailable: !isBooked,
          reason: isBooked ? 'Reserved by another client' : undefined
        };
      });

    } catch (err) {
      console.error('[BookingService] Failed to calculate slots:', err);
      return defaultSlots.map(t => ({ time: t, isAvailable: true }));
    }
  },

  async updateBookingStatus(id: string, status: string): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'bookings', id);

    // Fetch existing doc to notify buyer
    const snap = await getDoc(itemRef);
    const booking = snap.exists() ? snap.data() : null;

    await updateDoc(itemRef, {
      bookingStatus: status,
      updatedAt: serverTimestamp(),
    });

    if (booking?.buyerId) {
      try {
        await notificationService.notify(
          booking.buyerId,
          'order_update',
          `Booking Update: ${status}`,
          `Your appointment for "${booking.title}" on ${booking.bookingDate} at ${booking.bookingTime} is now marked as ${status}.`,
          { entityType: 'booking', entityId: id, priority: 'medium', linkTo: '/orders' }
        );
      } catch (notifErr) {
        console.warn('[BookingService] Buyer notification notice:', notifErr);
      }
    }
  },

  async updateBooking(id: string, updates: any): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'bookings', id);

    const snap = await getDoc(itemRef);
    const booking = snap.exists() ? snap.data() : null;

    if (updates.bookingDate && updates.bookingTime && booking) {
      const targetServiceId = booking.serviceId || updates.serviceId || '';
      const targetSellerId = booking.sellerId || updates.sellerId || '';
      const slotCheck = await this.checkSlotAvailability(
        targetServiceId,
        targetSellerId,
        updates.bookingDate,
        updates.bookingTime,
        id
      );

      if (!slotCheck.available) {
        throw new Error(
          `SLOT_UNAVAILABLE: The time slot "${updates.bookingTime}" on ${updates.bookingDate} is already reserved by another client.`
        );
      }
    }

    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (booking?.buyerId && updates.bookingStatus) {
      try {
        await notificationService.notify(
          booking.buyerId,
          'order_update',
          `Booking Update: ${updates.bookingStatus}`,
          `Your appointment for "${booking.title}" on ${booking.bookingDate} at ${booking.bookingTime} has been updated.`,
          { entityType: 'booking', entityId: id, priority: 'medium', linkTo: '/orders' }
        );
      } catch (notifErr) {
        console.warn('[BookingService] Buyer notification notice:', notifErr);
      }
    }
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

