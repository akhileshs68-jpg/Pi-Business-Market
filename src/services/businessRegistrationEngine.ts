/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc,
  runTransaction, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  UNIVERSAL_BUSINESS_TYPES, 
  RegistrationFormConfig, 
  UniversalBusinessRegistrationPayload 
} from '../core/business/universalBusinessTypes';
import { withRetry } from '../lib/retry';
import { UserRole } from '../types';

import { searchService } from './searchService';
import { removeUndefinedFields } from '../utils/firestoreUtils';
import { notificationService } from './notificationService';

export class BusinessRegistrationEngine {
  /**
   * Get form configuration and dynamic field specs for a specific business type key.
   * If the exact key is not found, falls back to default 'retail_shop' config.
   */
  static getFormConfigForType(typeKey: string): RegistrationFormConfig {
    if (UNIVERSAL_BUSINESS_TYPES[typeKey]) {
      return UNIVERSAL_BUSINESS_TYPES[typeKey];
    }
    // Search by title or businessType string match
    const foundEntry = Object.values(UNIVERSAL_BUSINESS_TYPES).find(
      cfg => cfg.businessType.toLowerCase() === typeKey.toLowerCase()
    );
    if (foundEntry) return foundEntry;

    // Default fallback config
    return UNIVERSAL_BUSINESS_TYPES['retail_shop'];
  }

  /**
   * Get all supported categories and business types for UI selection or API usage.
   */
  static getAllSupportedTypes(): Record<string, RegistrationFormConfig> {
    return UNIVERSAL_BUSINESS_TYPES;
  }

  /**
   * Validates a universal business registration payload against required core & dynamic fields.
   */
  static validateRegistrationPayload(payload: UniversalBusinessRegistrationPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.ownerUid || payload.ownerUid.trim() === '') {
      errors.push('Owner User UID is required.');
    }
    if (!payload.businessName || payload.businessName.trim() === '') {
      errors.push('Business Name is required.');
    }
    if (!payload.email || payload.email.trim() === '') {
      errors.push('Business Email is required.');
    }
    if (!payload.phone || payload.phone.trim() === '') {
      errors.push('Contact Phone is required.');
    }

    const config = this.getFormConfigForType(payload.businessType);
    if (config) {
      if (config.requiresTaxId && !payload.gstNumber && !payload.panNumber) {
        errors.push(`Business type ${config.businessType} requires a GST or PAN Tax ID.`);
      }

      // Check required dynamic fields
      if (payload.dynamicFields && config.customFields) {
        for (const field of config.customFields) {
          if (field.required) {
            const val = payload.dynamicFields[field.id];
            if (val === undefined || val === null || val === '') {
              errors.push(`Field '${field.label}' is required for ${config.businessType}.`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Registers a Universal Business atomically in Firestore.
   * Updates User document (One Account Policy), creates BusinessProfile, primary Store (if required), owner member record, and audit log.
   */
  static async registerBusiness(payload: UniversalBusinessRegistrationPayload): Promise<{
    success: boolean;
    businessId: string;
    storeId?: string;
  }> {
    const validation = this.validateRegistrationPayload(payload);
    if (!validation.valid) {
      throw new Error(`Business Registration Validation Failed: ${validation.errors.join(', ')}`);
    }

    return withRetry(async () => {
      const db = getFirebaseDb();
      const config = this.getFormConfigForType(payload.businessType);

      const businessId = `BIZ_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const businessRef = doc(db, 'businesses', businessId);
      const userRef = doc(db, 'users', payload.ownerUid);
      const memberRef = doc(db, 'businessMembers', `${businessId}_${payload.ownerUid}`);

      let primaryStoreId: string | undefined = undefined;
      let storeRef: any = null;

      if (config.requiresStore || payload.primaryStoreConfig) {
        primaryStoreId = `STORE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        storeRef = doc(db, 'stores', primaryStoreId);
      }

      await runTransaction(db, async (transaction) => {
        // 1. Fetch user doc to check existing roles
        const userSnap = await transaction.get(userRef);
        const existingUserData = userSnap.exists() ? userSnap.data() : {};
        const existingRoles: UserRole[] = existingUserData.roles || [existingUserData.role || 'Buyer'];

        let newRole: UserRole = 'Business Owner';
        if (config.category === 'professional_services') newRole = 'Professional';
        if (config.category === 'service_industries') newRole = 'Service Provider';

        const updatedRoles = Array.from(new Set([...existingRoles, newRole, 'Seller' as UserRole]));

        // 2. Prepare Business Document
        const legalName = payload.legalName || payload.businessName;
        const displayName = payload.businessName;
        
        const newBusinessData: Record<string, any> = {
          id: businessId,
          ownerUid: payload.ownerUid,
          businessName: payload.businessName,
          legalName,
          displayName,
          businessType: payload.businessType,
          category: payload.businessCategory,
          industry: config.category,
          description: payload.description || '',
          email: payload.email,
          phone: payload.phone,
          alternatePhone: payload.alternatePhone || '',
          website: payload.website || '',
          fullAddress: payload.address,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          postalCode: payload.postalCode,
          latitude: payload.latitude || 0,
          longitude: payload.longitude || 0,
          gstNumber: payload.gstNumber || '',
          panNumber: payload.panNumber || '',
          registrationNumber: payload.registrationNumber || '',
          licenseNumbers: payload.licenseNumbers || [],
          socialLinks: payload.socialLinks || {},
          dynamicFields: payload.dynamicFields || {},
          
          // Wallet Mappings
          walletAddress: payload.piWalletAddress || existingUserData.walletAddress || '',
          bmpWalletAddress: payload.bmpWalletAddress || existingUserData.bmpWalletAddress || `BMP_${payload.ownerUid}`,
          bmpRewardsEnabled: true,

          logoUrl: payload.logoUrl || '',
          coverImageUrl: payload.coverImageUrl || '',
          
          verificationStatus: 'Pending',
          kycStatus: existingUserData.kycVerified ? 'Verified' : 'Pending',
          businessStatus: 'active',
          rating: 0,
          reviewCount: 0,
          followers: 0,
          employeeCount: 1,
          storeCount: primaryStoreId ? 1 : 0,
          timezone: 'UTC',
          currency: 'PI',
          language: 'en',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: payload.ownerName,
          updatedBy: payload.ownerName
        };

        // Remove undefined fields
        const sanitizedBusiness: Record<string, any> = {};
        Object.entries(newBusinessData).forEach(([k, v]) => {
          if (v !== undefined) sanitizedBusiness[k] = v;
        });

        transaction.set(businessRef, sanitizedBusiness);

        // 3. Create Primary Store if applicable
        if (primaryStoreId && storeRef) {
          const storeName = payload.primaryStoreConfig?.storeName || `${payload.businessName} Main Branch`;
          const baseSlug = storeName
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          
          const newStoreData: Record<string, any> = {
            storeId: primaryStoreId,
            businessId,
            ownerUid: payload.ownerUid,
            storeName,
            storeSlug: `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`,
            storeType: payload.primaryStoreConfig?.storeType || 'Retail Outlet',
            storeCategory: payload.businessCategory,
            description: payload.description || '',
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            postalCode: payload.postalCode,
            latitude: payload.latitude || 0,
            longitude: payload.longitude || 0,
            deliveryAvailable: payload.primaryStoreConfig?.deliveryAvailable ?? true,
            pickupAvailable: payload.primaryStoreConfig?.pickupAvailable ?? true,
            status: 'active',
            verified: false,
            featured: false,
            followers: 0,
            rating: 0,
            reviewCount: 0,
            openingHours: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          transaction.set(storeRef, newStoreData);
        }

        // 4. Update User Profile (One Account Policy)
        const userUpdates: Record<string, any> = {
          roles: updatedRoles,
          activeRole: newRole,
          accountType: 'business',
          ownedBusinessIds: arrayUnion(businessId),
          updatedAt: serverTimestamp()
        };

        if (!existingUserData.primaryBusinessId) {
          userUpdates.primaryBusinessId = businessId;
        }
        if (primaryStoreId) {
          userUpdates.managedStoreIds = arrayUnion(primaryStoreId);
        }
        if (payload.piWalletAddress && !existingUserData.walletAddress) {
          userUpdates.walletAddress = payload.piWalletAddress;
        }
        if (payload.bmpWalletAddress && !existingUserData.bmpWalletAddress) {
          userUpdates.bmpWalletAddress = payload.bmpWalletAddress;
        }

        transaction.set(userRef, removeUndefinedFields(userUpdates), { merge: true });

        // 5. Create Owner Business Member Record
        transaction.set(memberRef, {
          memberId: `${businessId}_${payload.ownerUid}`,
          businessId,
          userUid: payload.ownerUid,
          role: 'Owner',
          permissions: ['*'],
          status: 'active',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 6. Universal Approval Entry
        const approvalRef = doc(collection(db, 'universalApprovals'));
        transaction.set(approvalRef, {
          id: approvalRef.id,
          approvalType: 'Business Registration',
          status: 'Pending Review',
          priority: 'High',
          entityId: businessId,
          entityName: payload.businessName,
          submittedBy: {
            uid: payload.ownerUid,
            name: payload.ownerName,
            email: payload.email
          },
          business: {
            id: businessId,
            name: payload.businessName,
            type: payload.businessType
          },
          submissionData: {
            businessType: payload.businessType,
            category: payload.businessCategory,
            email: payload.email,
            phone: payload.phone,
            city: payload.city,
            country: payload.country
          },
          submittedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 7. Audit Log Entry
        const auditRef = doc(collection(db, 'businessAuditLogs'));
        transaction.set(auditRef, {
          logId: auditRef.id,
          businessId,
          actorUid: payload.ownerUid,
          actorName: payload.ownerName,
          action: 'UNIVERSAL_BUSINESS_REGISTERED',
          entityType: 'business',
          entityId: businessId,
          description: `Universal Business '${payload.businessName}' (${payload.businessType}) registered under owner ${payload.ownerName}`,
          timestamp: serverTimestamp()
        });
      });

      // Dispatch notifications to seller and super admins
      try {
        await notificationService.notify(
          payload.ownerUid,
          'system_alert',
          'Seller Application Submitted',
          `Your seller application for "${payload.businessName}" has been submitted and is currently pending administrator review.`,
          { entityId: businessId, entityType: 'business', linkTo: '/business/dashboard' }
        );

        await notificationService.notifyAdmins(
          'system_alert',
          'New Seller Registration Pending Review',
          `New seller application submitted for "${payload.businessName}" by ${payload.ownerName}.`,
          { entityId: businessId, entityType: 'business', linkTo: '/admin-console' }
        );
      } catch (notifErr) {
        console.warn('Post-registration notification warning:', notifErr);
      }

      // Index business into search engine
      try {
        await searchService.indexEntity({
          entityType: 'business',
          entityId: businessId,
          businessId: businessId,
          title: payload.businessName,
          description: payload.description || `${payload.businessType} • ${payload.businessCategory || 'General'}`,
          keywords: [
            payload.businessName.toLowerCase(),
            payload.businessType.toLowerCase(),
            (payload.businessCategory || '').toLowerCase(),
            (payload.city || '').toLowerCase(),
            (payload.country || '').toLowerCase()
          ].filter(Boolean),
          categoryIds: [payload.businessCategory || 'general'],
          location: `${payload.city || ''}, ${payload.country || ''}`,
          visibility: 'public',
          status: 'active',
          featured: false,
          metadata: {
            businessType: payload.businessType,
            category: payload.businessCategory,
            city: payload.city,
            country: payload.country,
            logoUrl: payload.logoUrl,
            rating: 5.0,
            reviewCount: 1
          }
        });

        if (primaryStoreId) {
          await searchService.indexEntity({
            entityType: 'store',
            entityId: primaryStoreId,
            businessId: businessId,
            storeId: primaryStoreId,
            title: `${payload.businessName} Main Branch`,
            description: payload.description || `Store Outlet • ${payload.city || ''}`,
            keywords: [
              payload.businessName.toLowerCase(),
              'store',
              'outlet',
              (payload.city || '').toLowerCase()
            ].filter(Boolean),
            categoryIds: [payload.businessCategory || 'general'],
            location: `${payload.city || ''}, ${payload.country || ''}`,
            visibility: 'public',
            status: 'active',
            featured: false,
            metadata: {
              storeType: 'Retail Outlet',
              city: payload.city,
              country: payload.country,
              logoUrl: payload.logoUrl,
              rating: 5.0,
              reviewCount: 1
            }
          });
        }
      } catch (searchErr) {
        console.warn('Search index registration notice:', searchErr);
      }

      return {
        success: true,
        businessId,
        storeId: primaryStoreId
      };
    });
  }
}
