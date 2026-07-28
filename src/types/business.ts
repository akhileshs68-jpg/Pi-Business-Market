// Business Profile Specific Types
export interface BusinessProfileData {
  ownerUid: string;
  businessType: string; // roleId
  status: 'draft' | 'active' | 'suspended';
  businessName?: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: string;
  businessHours?: string;
  location?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  // Role specific fields
  [key: string]: any;
}
