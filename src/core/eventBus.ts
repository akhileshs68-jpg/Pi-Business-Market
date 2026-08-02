/**
 * Pi Business Market - Enterprise Event Bus
 * Decouples system modules (Orders, Wallet, Rewards, Payments, Messaging, Analytics)
 * by enabling asynchronous event publishing and subscription.
 */

export type SystemEventType =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'ORDER_COMPLETED'
  | 'WALLET_UPDATED'
  | 'REWARD_EARNED'
  | 'PAYMENT_VERIFIED'
  | 'BLOCKCHAIN_TX_CONFIRMED'
  | 'REVIEW_SUBMITTED'
  | 'PRODUCT_SHARED'
  | 'USER_REGISTERED'
  | 'BUSINESS_VERIFIED';

export interface SystemEventPayload<T = any> {
  eventId: string;
  type: SystemEventType;
  timestamp: string;
  userId?: string;
  data: T;
}

type EventCallback<T = any> = (event: SystemEventPayload<T>) => void | Promise<void>;

class EnterpriseEventBus {
  private listeners: Map<SystemEventType, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();

  /**
   * Subscribe to a specific system event
   */
  public subscribe<T = any>(eventType: SystemEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback as EventCallback);
      }
    };
  }

  /**
   * Subscribe to all system events
   */
  public subscribeAll(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Publish an event to all subscribers asynchronously
   */
  public publish<T = any>(type: SystemEventType, data: T, userId?: string): SystemEventPayload<T> {
    const eventPayload: SystemEventPayload<T> = {
      eventId: 'evt_' + Math.random().toString(36).substring(2, 10),
      type,
      timestamp: new Date().toISOString(),
      userId,
      data
    };

    // Dispatch asynchronously to avoid blocking the caller
    setTimeout(() => {
      const typeSet = this.listeners.get(type);
      if (typeSet) {
        typeSet.forEach(cb => {
          try {
            cb(eventPayload);
          } catch (err) {
            console.error(`[EventBus] Callback error on event ${type}:`, err);
          }
        });
      }

      this.globalListeners.forEach(cb => {
        try {
          cb(eventPayload);
        } catch (err) {
          console.error(`[EventBus] Global callback error on event ${type}:`, err);
        }
      });
    }, 0);

    return eventPayload;
  }
}

export const eventBus = new EnterpriseEventBus();
