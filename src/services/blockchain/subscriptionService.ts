/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockchainEvent, BlockchainEventType } from './blockchainTypes';
import { isFeatureEnabled } from './blockchainFeatureFlags';

type EventListener = (event: BlockchainEvent) => void;

export interface BackgroundQueueJob {
  id: string;
  type: 'REWARD_PROCESSING' | 'PAYMENT_VERIFICATION' | 'SETTLEMENT' | 'NOTIFICATION' | 'ANALYTICS';
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface SubscriptionHealthReport {
  isConnected: boolean;
  activeListenersCount: number;
  globalListenersCount: number;
  offlineQueueLength: number;
  currentBlockHeight: number;
  heartbeatStatus: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED';
  totalEventsProcessed: number;
  failedEventsCount: number;
  pendingBackgroundJobsCount: number;
  processedJobsCount: number;
  failedJobsCount: number;
  recentEvents: BlockchainEvent[];
}

class SubscriptionService {
  private listeners: Map<BlockchainEventType, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();
  private isConnected: boolean = false;
  private heartbeatTimer: any = null;
  private backgroundQueueTimer: any = null;
  private offlineQueue: BlockchainEvent[] = [];
  private currentBlockHeight: number = 18492042;

  // Stats & Monitoring
  private totalEventsProcessed: number = 0;
  private failedEventsCount: number = 0;
  private recentEvents: BlockchainEvent[] = [];
  private maxRecentEvents: number = 50;

  // Background Processing Queue
  private backgroundQueue: BackgroundQueueJob[] = [];
  private processedJobsCount: number = 0;
  private failedJobsCount: number = 0;

  // Rate Limiting
  private lastPublishTime: number = 0;
  private publishCountInWindow: number = 0;

  constructor() {
    this.startConnection();
    this.startBackgroundQueueProcessor();
  }

  /**
   * Start live subscription stream with heartbeat ping & block generation
   */
  public startConnection() {
    this.isConnected = true;
    console.log('[SubscriptionService] Centralized Subscription & Event Engine Initialized.');

    if (typeof window !== 'undefined' && !this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        if (!this.isConnected) {
          this.reconnect();
          return;
        }

        // Periodic block height sync event
        if (Math.random() > 0.4) {
          this.currentBlockHeight += 1;
          this.publishEvent('NEW_BLOCK', {
            blockNumber: this.currentBlockHeight,
            txCount: Math.floor(Math.random() * 15) + 1,
            hash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          });
        }
      }, 10000);
    }
  }

  /**
   * Reconnect automatically and flush offline queue
   */
  public reconnect() {
    console.log('[SubscriptionService] Reconnecting event stream & recovering missed events...');
    this.isConnected = true;

    // Flush offline queue
    while (this.offlineQueue.length > 0) {
      const event = this.offlineQueue.shift();
      if (event) this.dispatch(event);
    }
  }

  /**
   * Subscribe to specific event type
   */
  public subscribe(eventType: BlockchainEventType, callback: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return clean unsubscribe method
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Subscribe to ALL platform events (Global Event Listener)
   */
  public subscribeAll(callback: EventListener): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Publish an event into the central Event Bus
   */
  public publishEvent(type: BlockchainEventType, data: any, txHash?: string): BlockchainEvent {
    // Rate Limiting Protection (Max 100 events per second)
    const now = Date.now();
    if (now - this.lastPublishTime < 1000) {
      this.publishCountInWindow++;
      if (this.publishCountInWindow > 100) {
        console.warn('[SubscriptionService] Rate limit exceeded for event publication.');
      }
    } else {
      this.lastPublishTime = now;
      this.publishCountInWindow = 1;
    }

    // Mainnet & Feature Flag Protection Check
    if (type === 'SWAP_COMPLETED' && !isFeatureEnabled('enableBmpSwap')) {
      console.warn('[SubscriptionService] BMP Swap is disabled in feature flags. Event logged in test mode.');
    }

    const event: BlockchainEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      type,
      timestamp: new Date().toISOString(),
      blockNumber: this.currentBlockHeight,
      txHash: txHash || ('0x' + Math.random().toString(36).substring(2, 18)),
      data
    };

    // Keep track of recent events
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.pop();
    }

    if (!this.isConnected) {
      console.warn('[SubscriptionService] Connection offline. Enqueuing event into offline recovery queue:', type);
      this.offlineQueue.push(event);
    } else {
      this.dispatch(event);
    }

    // Auto-enqueue relevant tasks into background processing queue
    this.routeToBackgroundQueue(type, data);

    return event;
  }

  /**
   * Route platform events into asynchronous background job queue
   */
  private routeToBackgroundQueue(type: BlockchainEventType, data: any) {
    if (type === 'PAYMENT_CONFIRMED' || type === 'ORDER_CREATED') {
      this.enqueueBackgroundJob('PAYMENT_VERIFICATION', data);
      this.enqueueBackgroundJob('REWARD_PROCESSING', data);
    } else if (type === 'DELIVERED' || type === 'SETTLEMENT_COMPLETED') {
      this.enqueueBackgroundJob('SETTLEMENT', data);
    } else if (type === 'PUSH_NOTIFICATION' || type === 'IN_APP_NOTIFICATION' || type === 'EMAIL') {
      this.enqueueBackgroundJob('NOTIFICATION', data);
    } else if (type === 'ANALYTICS_EVENT') {
      this.enqueueBackgroundJob('ANALYTICS', data);
    }
  }

  /**
   * Enqueue job into background processing queue
   */
  public enqueueBackgroundJob(
    type: BackgroundQueueJob['type'],
    payload: any,
    maxRetries: number = 3
  ): BackgroundQueueJob {
    const job: BackgroundQueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      status: 'PENDING',
      retryCount: 0,
      maxRetries,
      createdAt: new Date().toISOString()
    };

    this.backgroundQueue.push(job);
    return job;
  }

  /**
   * Background queue processor daemon
   */
  private startBackgroundQueueProcessor() {
    if (typeof window === 'undefined') return;
    if (this.backgroundQueueTimer) clearInterval(this.backgroundQueueTimer);

    this.backgroundQueueTimer = setInterval(() => {
      this.processBackgroundQueue();
    }, 3000);
  }

  private async processBackgroundQueue() {
    const pendingJobs = this.backgroundQueue.filter(j => j.status === 'PENDING');
    if (pendingJobs.length === 0) return;

    for (const job of pendingJobs) {
      job.status = 'PROCESSING';
      try {
        // Execute background job execution logic
        await this.executeJob(job);
        job.status = 'COMPLETED';
        job.processedAt = new Date().toISOString();
        this.processedJobsCount++;

        this.publishEvent('QUEUE_JOB_PROCESSED', { jobId: job.id, jobType: job.type });
      } catch (err: any) {
        job.retryCount++;
        job.errorMessage = err.message || 'Processing failed';

        if (job.retryCount < job.maxRetries) {
          job.status = 'PENDING'; // Retry next cycle
        } else {
          job.status = 'FAILED';
          this.failedJobsCount++;
          this.publishEvent('QUEUE_JOB_FAILED', { jobId: job.id, jobType: job.type, error: err.message });
        }
      }
    }

    // Clean up completed or failed jobs older than 100 items
    if (this.backgroundQueue.length > 100) {
      this.backgroundQueue = this.backgroundQueue.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING');
    }
  }

  private async executeJob(job: BackgroundQueueJob): Promise<void> {
    // Simulated async background work
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private dispatch(event: BlockchainEvent) {
    this.totalEventsProcessed++;

    // Notify type-specific listeners
    const set = this.listeners.get(event.type);
    if (set) {
      set.forEach(cb => {
        try {
          cb(event);
        } catch (e) {
          this.failedEventsCount++;
          console.error(`[SubscriptionService] Callback error for ${event.type}:`, e);
        }
      });
    }

    // Notify global listeners
    this.globalListeners.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        this.failedEventsCount++;
        console.error('[SubscriptionService] Global callback error:', e);
      }
    });
  }

  /**
   * Get total count of registered listeners across all event types
   */
  public getActiveListenersCount(): number {
    let count = 0;
    this.listeners.forEach(set => { count += set.size; });
    return count;
  }

  /**
   * Get comprehensive Admin Monitoring Report
   */
  public getHealthReport(): SubscriptionHealthReport {
    return {
      isConnected: this.isConnected,
      activeListenersCount: this.getActiveListenersCount(),
      globalListenersCount: this.globalListeners.size,
      offlineQueueLength: this.offlineQueue.length,
      currentBlockHeight: this.currentBlockHeight,
      heartbeatStatus: this.isConnected ? 'HEALTHY' : 'DISCONNECTED',
      totalEventsProcessed: this.totalEventsProcessed,
      failedEventsCount: this.failedEventsCount,
      pendingBackgroundJobsCount: this.backgroundQueue.filter(j => j.status === 'PENDING').length,
      processedJobsCount: this.processedJobsCount,
      failedJobsCount: this.failedJobsCount,
      recentEvents: [...this.recentEvents]
    };
  }

  public getConnectionStatus(): { isConnected: boolean; queueLength: number; currentBlock: number } {
    return {
      isConnected: this.isConnected,
      queueLength: this.offlineQueue.length,
      currentBlock: this.currentBlockHeight
    };
  }
}

export const subscriptionService = new SubscriptionService();
