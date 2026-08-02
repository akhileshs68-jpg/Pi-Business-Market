/**
 * Enterprise Store Management Engine
 * Pi Business Market
 */

import { storeService } from '../../services/storeService';
import { searchService } from '../../services/searchService';
import { 
  EnterpriseStoreType, 
  EnterpriseStoreProfile, 
  EnterpriseStoreConfig, 
  StoreVerificationStatus,
  StoreAnalyticsMetrics
} from './enterpriseStoreTypes';
import { Store } from '../../types';

export const ENTERPRISE_STORE_CONFIGS: Record<string, EnterpriseStoreConfig> = {
  'Retail Store': {
    storeType: 'Retail Store',
    category: 'retail',
    defaultDeliveryMode: 'delivery',
    supportsProducts: true,
    supportsServices: false
  },
  'Wholesale Store': {
    storeType: 'Wholesale Store',
    category: 'wholesale',
    defaultDeliveryMode: 'shipping',
    supportsProducts: true,
    supportsServices: false
  },
  'Manufacturer Store': {
    storeType: 'Manufacturer Store',
    category: 'manufacturing',
    defaultDeliveryMode: 'shipping',
    supportsProducts: true,
    supportsServices: false
  },
  'Medical Store': {
    storeType: 'Medical Store',
    category: 'healthcare',
    defaultDeliveryMode: 'delivery',
    requiredDocuments: ['Drug License', 'GST Registration'],
    supportsProducts: true,
    supportsServices: false
  },
  'Restaurant': {
    storeType: 'Restaurant',
    category: 'hospitality',
    defaultDeliveryMode: 'delivery',
    supportsProducts: true,
    supportsServices: false
  },
  'Digital Store': {
    storeType: 'Digital Store',
    category: 'digital',
    defaultDeliveryMode: 'digital',
    supportsProducts: true,
    supportsServices: true
  },
  'Professional Office': {
    storeType: 'Professional Office',
    category: 'professional_services',
    defaultDeliveryMode: 'pickup',
    supportsProducts: false,
    supportsServices: true
  },
  'Clinic': {
    storeType: 'Clinic',
    category: 'healthcare',
    defaultDeliveryMode: 'pickup',
    supportsProducts: true,
    supportsServices: true
  },
  'School': {
    storeType: 'School',
    category: 'education',
    defaultDeliveryMode: 'pickup',
    supportsProducts: true,
    supportsServices: true
  }
};

export class EnterpriseStoreEngine {
  /**
   * Get store type configuration defaults
   */
  static getStoreConfig(type: EnterpriseStoreType): EnterpriseStoreConfig {
    return ENTERPRISE_STORE_CONFIGS[type] || {
      storeType: type,
      category: 'general',
      defaultDeliveryMode: 'delivery',
      supportsProducts: true,
      supportsServices: true
    };
  }

  /**
   * Enhanced Enterprise Store Registration / Update helper
   */
  static async updateEnterpriseProfile(
    storeId: string, 
    updates: Partial<EnterpriseStoreProfile>
  ): Promise<void> {
    await storeService.updateStore(storeId, updates as Partial<Store>);

    // Re-index into Search Engine
    try {
      const storeDoc = await storeService.getStore(storeId);
      if (storeDoc) {
        await searchService.indexEntity({
          entityType: 'store',
          entityId: storeId,
          businessId: storeDoc.businessId,
          storeId: storeId,
          title: storeDoc.storeName,
          description: storeDoc.description || `${storeDoc.storeType} outlet in ${storeDoc.city}`,
          keywords: [
            storeDoc.storeName.toLowerCase(),
            storeDoc.storeType.toLowerCase(),
            (storeDoc.storeCategory || '').toLowerCase(),
            (storeDoc.city || '').toLowerCase()
          ].filter(Boolean),
          categoryIds: [storeDoc.storeCategory || 'general'],
          location: `${storeDoc.city || ''}, ${storeDoc.country || ''}`,
          visibility: storeDoc.status === 'active' ? 'public' : 'hidden',
          status: storeDoc.status,
          featured: storeDoc.featured || false,
          metadata: {
            storeType: storeDoc.storeType,
            city: storeDoc.city,
            country: storeDoc.country,
            logoUrl: storeDoc.logoUrl,
            rating: storeDoc.rating || 5.0,
            reviewCount: storeDoc.reviewCount || 1,
            deliveryAvailable: storeDoc.deliveryAvailable,
            pickupAvailable: storeDoc.pickupAvailable
          }
        });
      }
    } catch (searchErr) {
      console.warn('Enterprise store search re-index notice:', searchErr);
    }
  }

  /**
   * Toggle store status (Open/Closed)
   */
  static async setStoreOpenStatus(storeId: string, isOpen: boolean): Promise<void> {
    await storeService.updateStore(storeId, {
      ...( { isOpen } as any )
    });
  }

  /**
   * Set Vacation Mode
   */
  static async setVacationMode(storeId: string, vacationMode: boolean, vacationMessage?: string): Promise<void> {
    await storeService.updateStore(storeId, {
      ...( { vacationMode, vacationMessage: vacationMessage || '' } as any )
    });
  }

  /**
   * Update Verification Status (Admin / System)
   */
  static async updateVerificationStatus(
    storeId: string, 
    status: StoreVerificationStatus, 
    notes?: string
  ): Promise<void> {
    const isApproved = status === 'Approved';
    await storeService.updateStore(storeId, {
      verified: isApproved,
      ...( { verificationStatus: status, verificationNotes: notes || '' } as any )
    });
  }

  /**
   * Compute mock default analytics metrics for new / active stores
   */
  static getDefaultAnalytics(store: Store): StoreAnalyticsMetrics {
    return {
      productViews: 128,
      serviceViews: 42,
      ordersCount: 15,
      revenuePi: 450.5,
      bmpRewardsDistributed: 90,
      conversionRate: 3.8,
      repeatCustomersCount: 8,
      visitorsToday: 34,
      topSellingProducts: [],
      topServices: [],
      trafficSources: [
        { name: 'Marketplace Search', percentage: 55 },
        { name: 'Direct Business Link', percentage: 25 },
        { name: 'Category Browsing', percentage: 20 }
      ]
    };
  }
}
