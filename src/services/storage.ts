/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Store,
  Notification,
} from '../types';

const STORAGE_KEY_PREFIX = 'pi_biz_mkt_';

const KEYS = {
  USERS: `${STORAGE_KEY_PREFIX}users`,
  STORES: `${STORAGE_KEY_PREFIX}stores`,
  CURRENT_USER: `${STORAGE_KEY_PREFIX}current_user`,
};

const DEFAULT_CURRENT_USER: User = {
  uid: 'user_active_pioneer',
  piUid: 'user_active_pioneer_pi',
  username: 'pi_pioneer_88',
  displayName: 'Alex Mercer',
  walletAddress: 'GBCWD32QYJ7LURP5H6V77JHYX345PPONNFFVVZZ44SSTT22XXYYZZ',
  role: 'Buyer',
  accountType: 'individual',
  verified: true,
  kycVerified: false,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  status: 'active'
};

const SEED_USERS: User[] = [DEFAULT_CURRENT_USER];

export class PiBusinessMarketDB {
  static init() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(KEYS.STORES)) {
      localStorage.setItem(KEYS.STORES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(DEFAULT_CURRENT_USER));
    }
  }

  private static get<T>(key: string): T[] {
    this.init();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private static save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static getCurrentUser(): User {
    this.init();
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : DEFAULT_CURRENT_USER;
  }

  static saveCurrentUser(user: User): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    const users = this.get<User>(KEYS.USERS);
    const index = users.findIndex(u => u.uid === user.uid);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.save(KEYS.USERS, users);
  }

  static getUsers(): User[] {
    return this.get<User>(KEYS.USERS);
  }

  static getStores(): Store[] {
    return this.get<Store>(KEYS.STORES);
  }

  static getStoresByOwner(ownerUid: string): Store[] {
    return this.getStores().filter(s => s.ownerUid === ownerUid);
  }

  static getStoreById(id: string): Store | undefined {
    return this.getStores().find(s => s.storeId === id);
  }

  static createStore(store: Omit<Store, 'storeId' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'status' | 'verified' | 'featured' | 'followers'>): Store {
    const stores = this.getStores();
    const newStore: Store = {
      ...store,
      storeId: `store_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      status: 'active',
      followers: 0,
      verified: false,
      featured: false
    };
    stores.push(newStore);
    this.save(KEYS.STORES, stores);
    return newStore;
  }

  static updateStore(id: string, updates: Partial<Store>): Store {
    const stores = this.getStores();
    const index = stores.findIndex(s => s.storeId === id);
    if (index === -1) throw new Error('Store not found');
    const updated = { ...stores[index], ...updates, updatedAt: new Date().toISOString() };
    stores[index] = updated;
    this.save(KEYS.STORES, stores);
    return updated;
  }

  // Stubs for legacy methods to avoid build errors
  static getProducts(): any[] { return []; }
  static getProductsByStore(storeId: string): any[] { return []; }
  static createProduct(product: any): any { return {}; }
  static updateProduct(productId: string, updates: any): any { return {}; }
  static deleteProduct(productId: string): void {}
  static incrementProductViews(productId: string): void {}
  static getOrders(): any[] { return []; }
  static getOrdersByBuyer(buyerUid: string): any[] { return []; }
  static getOrdersByStore(storeId: string): any[] { return []; }
  static getOrderById(id: string): any | undefined { return undefined; }
  static createOrder(orderData: any): any { return {}; }
  static updateOrderStatus(orderId: string, status: any): any { return {}; }
  static getReviews(): any[] { return []; }
  static getReviewsByProduct(productId: string): any[] { return []; }
  static getReviewsByStore(storeId: string): any[] { return []; }
  static createReview(reviewData: any): any { return {}; }
  static replyToReview(reviewId: string, responseText: string): any { return {}; }
  static getNotifications(recipientUid: string): Notification[] { return []; }
  static createNotification(recipientUid: string, title: string, message: string, type: any, linkTo?: string): any { return {}; }
  static markNotificationAsRead(notifId: string): void {}
  static markAllNotificationsAsRead(recipientUid: string): void {}
  static getPioneerProfiles(): any[] { return []; }
  static getPioneerProfileById(id: string): any | undefined { return undefined; }
  static getPioneerProfileByOwner(ownerUid: string): any | undefined { return undefined; }
  static getPioneerProfilesByOwner(ownerUid: string): any[] { return []; }
  static encodeGeohash(lat: number, lng: number): string { return ""; }
  static calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number { return 0; }
  static calculateProfileTrustScore(profile: any): any { return { score: 0, metrics: {} }; }
  static createPioneerProfile(profileData: any): any { return {}; }
  static updatePioneerProfile(id: string, updates: any): any { return {}; }
  static rollbackProfileVersion(profileId: string, targetVersion: number): any { return {}; }
  static softDeletePioneerProfile(id: string): any { return {}; }
  static recoverPioneerProfile(id: string): any { return {}; }
  static getJobs(): any[] { return []; }
  static getJobById(id: string): any | undefined { return undefined; }
  static getJobsByProvider(providerUid: string): any[] { return []; }
  static createJob(jobData: any): any { return {}; }
  static updateJobStatus(jobId: string, status: any): any { return {}; }
  static getJobApplications(): any[] { return []; }
  static getApplicationsForJob(jobId: string): any[] { return []; }
  static getApplicationsByApplicant(applicantUid: string): any[] { return []; }
  static applyToJob(appData: any): any { return {}; }
  static updateApplicationStatus(appId: string, status: any): any { return {}; }
  static getUnifiedListings(): any[] { return []; }
  static getUnifiedListingById(id: string): any | undefined { return undefined; }
  static getUnifiedListingsByOwner(ownerUid: string): any[] { return []; }
  static createUnifiedListing(listingData: any): any { return {}; }
  static updateUnifiedListing(id: string, updates: any): any { return {}; }
  static deleteUnifiedListing(id: string): void {}

  static resetDB(): void {
    localStorage.clear();
  }
}
