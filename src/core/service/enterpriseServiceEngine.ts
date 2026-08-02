/**
 * Enterprise Service Management Engine
 * Pi Business Market
 */

import { serviceMarketplaceService } from '../../services/serviceMarketplaceService';
import { searchService } from '../../services/searchService';
import { EnterpriseServiceProfile, UniversalServiceCategory } from './enterpriseServiceTypes';
import { Service } from '../../types';

export const UNIVERSAL_SERVICE_CATEGORIES: UniversalServiceCategory[] = [
  'Doctor & Healthcare',
  'Hospital & Clinic',
  'Teacher, Tutor & Education',
  'Coaching & Institutes',
  'Lawyer & Legal Services',
  'CA, CS & Financial Services',
  'Architect & Engineering',
  'Software & IT Services',
  'Digital Marketing & Content',
  'Photography & Videography',
  'Design & Creative',
  'Consulting & Business Advisory',
  'Travel & Tourism',
  'Transport & Logistics',
  'Restaurant & Food Service',
  'Salon, Spa & Beauty',
  'Fitness & Gym',
  'Repair & Maintenance',
  'Electrician, Plumber & Mechanical',
  'Construction & Real Estate',
  'Agriculture & Farming Services',
  'NGO, Trust & Social Services'
];

export class EnterpriseServiceEngine {
  /**
   * Save or Update an Enterprise Service and re-index into search engine
   */
  static async saveService(
    serviceData: Partial<EnterpriseServiceProfile>,
    isEdit: boolean = false,
    existingServiceId?: string
  ): Promise<string> {
    let serviceId = existingServiceId;

    const sanitizedPayload: any = {
      ...serviceData,
      title: serviceData.title || 'Untitled Service',
      category: serviceData.category || serviceData.serviceCategory || 'General Services',
      subCategory: serviceData.subCategory || serviceData.serviceSubCategory || 'Professional',
      pricingType: serviceData.pricingType || 'fixed',
      basePrice: Number(serviceData.basePrice) || 0,
      currency: serviceData.currency || 'π',
      locationType: serviceData.locationType || 'online',
      status: serviceData.status || 'published',
      visibility: serviceData.visibility || 'public',
      featured: serviceData.featured || false,
      rating: serviceData.rating || 5.0,
      reviewCount: serviceData.reviewCount || 1,
      bookingCount: serviceData.bookingCount || 0,
      imageUrls: serviceData.imageUrls || (serviceData.mainImage ? [serviceData.mainImage] : []),
      mainImage: serviceData.mainImage || (serviceData.imageUrls?.[0]) || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500'
    };

    if (isEdit && serviceId) {
      await serviceMarketplaceService.updateService(serviceId, sanitizedPayload);
    } else {
      serviceId = await serviceMarketplaceService.createService(sanitizedPayload);
    }

    // Automatically index into Universal Search Engine
    try {
      if (serviceId) {
        await searchService.indexEntity({
          entityType: 'service',
          entityId: serviceId,
          businessId: serviceData.businessId || 'none',
          storeId: serviceData.storeId || 'none',
          title: sanitizedPayload.title,
          description: serviceData.description || `${sanitizedPayload.category} • ${sanitizedPayload.subCategory}`,
          keywords: [
            sanitizedPayload.title.toLowerCase(),
            sanitizedPayload.category.toLowerCase(),
            sanitizedPayload.subCategory.toLowerCase(),
            (serviceData.serviceArea || '').toLowerCase()
          ].filter(Boolean),
          categoryIds: [sanitizedPayload.category.toLowerCase()],
          location: serviceData.serviceArea || 'Global',
          visibility: sanitizedPayload.visibility === 'public' ? 'public' : 'hidden',
          status: sanitizedPayload.status === 'published' ? 'active' : 'inactive',
          featured: sanitizedPayload.featured || false,
          metadata: {
            serviceId: serviceId,
            price: sanitizedPayload.basePrice,
            currency: sanitizedPayload.currency,
            pricingType: sanitizedPayload.pricingType,
            locationType: sanitizedPayload.locationType,
            category: sanitizedPayload.category,
            mainImage: sanitizedPayload.mainImage,
            rating: sanitizedPayload.rating,
            reviewCount: sanitizedPayload.reviewCount,
            emergencyService: serviceData.emergencyService || false
          }
        });
      }
    } catch (searchErr) {
      console.warn('[EnterpriseServiceEngine] Search index notice:', searchErr);
    }

    return serviceId || '';
  }

  /**
   * Duplicate existing service
   */
  static async duplicateService(serviceId: string, currentServices: Service[]): Promise<string> {
    const original = currentServices.find(s => s.serviceId === serviceId);
    if (!original) {
      throw new Error('Original service not found');
    }

    const { serviceId: sid, createdAt, updatedAt, ...copyData } = original as any;
    copyData.title = `${original.title || 'Service'} (Copy)`;
    copyData.status = 'draft';

    return await this.saveService(copyData, false);
  }

  /**
   * Delete / Archive Service
   */
  static async deleteService(serviceId: string): Promise<void> {
    await serviceMarketplaceService.deleteService(serviceId);
  }

  /**
   * Get list of universal service categories
   */
  static getUniversalCategories(): UniversalServiceCategory[] {
    return UNIVERSAL_SERVICE_CATEGORIES;
  }
}
