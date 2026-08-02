/**
 * Enterprise Product Management System - Types & Standards
 * Pi Business Market
 */

import { Product, ProductType, ProductStatus, VisibilityStatus, StockStatus } from '../../types';

export type EnterpriseProductType =
  | 'physical'
  | 'digital'
  | 'downloadable'
  | 'subscription'
  | 'rental'
  | 'wholesale'
  | 'retail'
  | 'manufactured'
  | 'agricultural'
  | 'medical'
  | 'educational'
  | 'professional'
  | string;

export interface ProductVariant {
  id: string;
  sku: string;
  name: string; // e.g. 'Red / Large'
  size?: string;
  color?: string;
  weight?: number;
  material?: string;
  capacity?: string;
  storage?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  imageUrl?: string;
}

export interface BulkPricingTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercentage?: number;
}

export interface ProductPricingEngine {
  regularPrice: number;
  salePrice?: number;
  offerPrice?: number;
  wholesalePrice?: number;
  flashSalePrice?: number;
  isFlashSaleActive?: boolean;
  bulkPricingTiers?: BulkPricingTier[];
  minOrderQty: number;
  maxOrderQty?: number;
  currency: string;
  taxClass?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
  group?: string; // e.g. 'Technical Specs', 'Dimensions'
}

export interface EnterpriseProductProfile extends Product {
  gallery?: string[];
  videoUrl?: string;
  brochurePdfUrl?: string;
  hsnCode?: string;
  barcode?: string;
  countryOfOrigin?: string;
  warrantyPeriod?: string;
  manufacturerName?: string;
  specifications?: ProductSpecification[];
  highlights?: string[];
  variants?: ProductVariant[];
  pricingEngine?: ProductPricingEngine;
  bulkPricing?: BulkPricingTier[];
  lowStockThreshold?: number;
  isLowStockAlert?: boolean;
  seoKeywords?: string[];
  seoOgImage?: string;
  rating?: number;
  reviewCount?: number;
  storeName?: string;
  businessName?: string;
}
