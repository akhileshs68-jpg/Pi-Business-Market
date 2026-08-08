export interface ProductBase {
  id: string;
  ownerUid: string;
  businessId?: string; // profileId
  roleId: string;
  type: 'product';
  
  // Common Fields
  productName: string;
  category: string;
  description: string;
  images?: string[];
  video?: string;
  price: number;
  discount?: number;
  currency?: string;
  pricingMode?: 'EXCHANGE' | 'COMMUNITY';
  localCurrency?: string;
  localAmount?: number;
  communityPiAmount?: number;
  stock?: number;
  sku?: string;
  brand?: string;
  tags?: string;
  status: string;

  // Role specific fields
  [key: string]: any;
}
