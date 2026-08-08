export interface ServiceBase {
  id: string;
  ownerUid: string;
  businessId?: string; // profileId
  roleId: string;
  type: 'service';
  
  // Common Fields
  serviceName: string;
  category: string;
  description: string;
  images?: string[];
  price: number;
  currency?: string;
  pricingMode?: 'EXCHANGE' | 'COMMUNITY';
  localCurrency?: string;
  localAmount?: number;
  communityPiAmount?: number;
  duration?: string;
  bookingRequired?: boolean;
  availableDays?: string;
  availableTime?: string;
  status: string;

  // Role specific fields
  [key: string]: any;
}
