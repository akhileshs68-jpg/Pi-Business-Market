/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UniversalBusinessCategory =
  | 'retail_wholesale'
  | 'professional_services'
  | 'organizations_institutions'
  | 'service_industries'
  | 'agriculture_production'
  | 'technology_creative';

export type EnterpriseLegalEntity =
  | 'Sole Proprietorship'
  | 'Partnership'
  | 'LLP (Limited Liability Partnership)'
  | 'Private Limited Company'
  | 'Public Limited Company'
  | 'MSME / Small Enterprise'
  | 'Startup'
  | 'NGO / Non-Profit'
  | 'Trust / Society'
  | 'Government / Semi-Govt';

export interface DynamicFieldSpec {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'boolean' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

export interface RegistrationFormConfig {
  category: UniversalBusinessCategory;
  businessType: string;
  title: string;
  description: string;
  requiresStore: boolean; // Auto-creates a primary store outlet
  requiresLicense: boolean;
  requiresTaxId: boolean; // e.g. GST/VAT/PAN
  customFields: DynamicFieldSpec[];
}

export interface UniversalBusinessRegistrationPayload {
  ownerUid: string;
  ownerName: string;
  businessName: string;
  legalName?: string;
  businessCategory: UniversalBusinessCategory;
  businessType: string;
  legalEntity?: EnterpriseLegalEntity;
  description: string;
  
  // Contact & Location
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  
  // Tax & Regulatory
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  licenseNumbers?: Array<{ type: string; number: string; expiryDate?: string }>;
  
  // Media & Branding
  logoUrl?: string;
  coverImageUrl?: string;
  
  // Blockchain Wallet Mapping
  piWalletAddress?: string;
  bmpWalletAddress?: string;
  
  // Dynamic business fields based on registration engine
  dynamicFields?: Record<string, any>;
  
  // Social links
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
  };

  // Primary store configuration (if applicable)
  primaryStoreConfig?: {
    storeName: string;
    storeType: string;
    deliveryAvailable: boolean;
    pickupAvailable: boolean;
  };
}

// Master Categories & Business Types Constants
export const UNIVERSAL_BUSINESS_TYPES: Record<string, RegistrationFormConfig> = {
  // Retail & Wholesale
  'retail_shop': {
    category: 'retail_wholesale',
    businessType: 'Retail Shop',
    title: 'Retail Shop / Local Merchant',
    description: 'Physical or online retail store selling physical consumer products.',
    requiresStore: true,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'hasPhysicalStore', label: 'Physical Storefront Available', type: 'boolean', required: true },
      { id: 'deliveryRadiusKm', label: 'Delivery Radius (km)', type: 'number', required: false, placeholder: '10' },
      { id: 'acceptsReturns', label: 'Accepts Product Returns', type: 'boolean', required: false }
    ]
  },
  'wholesale_distributor': {
    category: 'retail_wholesale',
    businessType: 'Wholesale / Distributor',
    title: 'Wholesaler & Distributor',
    description: 'Bulk product distributor or supply-chain partner.',
    requiresStore: true,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'moq', label: 'Minimum Order Quantity (MOQ)', type: 'number', required: true, placeholder: '100' },
      { id: 'sellsToRetailers', label: 'Sells Direct to Retailers', type: 'boolean', required: true },
      { id: 'exportReady', label: 'Export Ready', type: 'boolean', required: false }
    ]
  },
  'manufacturer': {
    category: 'retail_wholesale',
    businessType: 'Manufacturer',
    title: 'Manufacturer / Production Facility',
    description: 'Product manufacturing unit or industrial facility.',
    requiresStore: true,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'factoryAddress', label: 'Factory / Plant Address', type: 'textarea', required: true },
      { id: 'productionCapacity', label: 'Monthly Production Capacity', type: 'text', required: false, placeholder: '10,000 units/month' },
      { id: 'certifications', label: 'Quality Certifications (ISO, GMP, etc.)', type: 'text', required: false }
    ]
  },

  // Healthcare & Medical
  'doctor_clinic': {
    category: 'professional_services',
    businessType: 'Doctor / Clinic',
    title: 'Doctor, Specialist or Clinic',
    description: 'Healthcare practitioner, specialist, or outpatient clinic.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: false,
    customFields: [
      { id: 'medicalLicenseNo', label: 'Medical Council Registration No.', type: 'text', required: true },
      { id: 'specialization', label: 'Medical Specialization', type: 'text', required: true, placeholder: 'Cardiology, Pediatrics, General Medicine' },
      { id: 'consultationFee', label: 'Consultation Fee (Pi)', type: 'number', required: true },
      { id: 'emergencyServices', label: '24/7 Emergency Service Available', type: 'boolean', required: false }
    ]
  },
  'hospital_healthcare': {
    category: 'professional_services',
    businessType: 'Hospital / Medical Center',
    title: 'Hospital & Medical Center',
    description: 'Inpatient and outpatient healthcare institution.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'hospitalRegNo', label: 'Hospital Registration / Accreditation No.', type: 'text', required: true },
      { id: 'bedCount', label: 'Total Inpatient Beds', type: 'number', required: false },
      { id: 'ambulanceService', label: 'Ambulance Service Available', type: 'boolean', required: false }
    ]
  },
  'pharmacy_medical_store': {
    category: 'retail_wholesale',
    businessType: 'Pharmacy / Medical Store',
    title: 'Pharmacy & Medical Supply',
    description: 'Licensed retail pharmacy or medical supplies dealer.',
    requiresStore: true,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'drugLicenseNo', label: 'Drug License Number', type: 'text', required: true },
      { id: 'homeDelivery', label: 'Medicine Home Delivery', type: 'boolean', required: false }
    ]
  },

  // Legal, Finance & Engineering Professionals
  'lawyer_legal': {
    category: 'professional_services',
    businessType: 'Lawyer / Legal Firm',
    title: 'Lawyer, Advocate or Legal Consultancy',
    description: 'Legal representation, advisory, and litigation services.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: false,
    customFields: [
      { id: 'barCouncilNo', label: 'Bar Council Enrollment Number', type: 'text', required: true },
      { id: 'practiceAreas', label: 'Practice Areas', type: 'text', required: true, placeholder: 'Corporate, Criminal, Civil, IP Law' },
      { id: 'hourlyRate', label: 'Hourly Advisory Rate (Pi)', type: 'number', required: false }
    ]
  },
  'chartered_accountant': {
    category: 'professional_services',
    businessType: 'Chartered Accountant / Tax Consultant',
    title: 'CA, CPA or Financial Advisory',
    description: 'Audit, tax compliance, accounting, and corporate finance services.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'caMembershipNo', label: 'CA / CPA Membership Number', type: 'text', required: true },
      { id: 'firmRegistrationNo', label: 'Firm Registration Number (FRN)', type: 'text', required: false }
    ]
  },
  'engineer_architect': {
    category: 'professional_services',
    businessType: 'Architect / Engineer / Designer',
    title: 'Architect, Civil/Software Engineer or Designer',
    description: 'Professional engineering, architectural, interior or technical consultancy.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: false,
    customFields: [
      { id: 'councilRegNo', label: 'Professional Council / COA Registration', type: 'text', required: false },
      { id: 'domainExpertise', label: 'Domain Expertise', type: 'text', required: true, placeholder: 'Structural, Software, Interior, MEP' }
    ]
  },

  // Education & Coaching
  'school_college': {
    category: 'organizations_institutions',
    businessType: 'School / College / University',
    title: 'Educational Institution',
    description: 'Formal school, college, university, or academic institute.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'boardAffiliation', label: 'Board / University Affiliation', type: 'text', required: true, placeholder: 'CBSE, State Board, University' },
      { id: 'accreditationNo', label: 'Government Recognition No.', type: 'text', required: true }
    ]
  },
  'teacher_coaching': {
    category: 'professional_services',
    businessType: 'Teacher / Coaching Institute',
    title: 'Tutor, Instructor or Academy',
    description: 'Private tutor, coaching institute, test prep center, or online academy.',
    requiresStore: false,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'subjectsOffered', label: 'Subjects / Courses Offered', type: 'text', required: true, placeholder: 'Math, Physics, Coding, IELTS' },
      { id: 'teachingMode', label: 'Teaching Mode', type: 'select', required: true, options: ['Online', 'Offline', 'Hybrid'] }
    ]
  },

  // Organizations & Non-Profits
  'ngo_charity': {
    category: 'organizations_institutions',
    businessType: 'NGO / Charity / Trust',
    title: 'Non-Profit, NGO or Charity Foundation',
    description: 'Social welfare, environmental, non-profit, or philanthropic organization.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'ngoRegNo', label: 'NGO / Trust Registration Number', type: 'text', required: true },
      { id: 'causeArea', label: 'Primary Cause / Mission', type: 'text', required: true, placeholder: 'Education, Healthcare, Poverty Alleviation' },
      { id: 'taxExemptStatus', label: 'Tax Exemption Registration (e.g. 80G/12A)', type: 'text', required: false }
    ]
  },

  // Service Industries
  'restaurant_cafe': {
    category: 'service_industries',
    businessType: 'Restaurant / Cafe / Hotel',
    title: 'Restaurant, Cafe or Hospitality',
    description: 'Food, beverage, hotel, or hospitality establishment.',
    requiresStore: true,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'fssaiLicenseNo', label: 'Food Safety / FSSAI License No.', type: 'text', required: true },
      { id: 'cuisines', label: 'Cuisines Offered', type: 'text', required: false, placeholder: 'Italian, Asian, Cafe, Bakery' },
      { id: 'seatingCapacity', label: 'Seating Capacity', type: 'number', required: false }
    ]
  },
  'salon_spa_gym': {
    category: 'service_industries',
    businessType: 'Salon / Spa / Fitness Center',
    title: 'Salon, Spa or Fitness Center',
    description: 'Personal care, wellness, grooming, gym, or fitness studio.',
    requiresStore: true,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'servicesOffered', label: 'Primary Services', type: 'text', required: true, placeholder: 'Haircut, Facial, Personal Training' },
      { id: 'genderServed', label: 'Target Clientele', type: 'select', required: true, options: ['Unisex', 'Men Only', 'Women Only'] }
    ]
  },
  'home_repair_services': {
    category: 'service_industries',
    businessType: 'Home & Repair Services',
    title: 'Electrician, Plumber, Appliance Repair or Technician',
    description: 'Maintenance, installation, appliance repair, plumbing, or electrical work.',
    requiresStore: false,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'serviceTypes', label: 'Service Types', type: 'text', required: true, placeholder: 'AC Repair, Wiring, Pipe Fitting' },
      { id: 'serviceRadiusKm', label: 'Service Area Radius (km)', type: 'number', required: true, placeholder: '15' }
    ]
  },
  'transport_courier': {
    category: 'service_industries',
    businessType: 'Transport / Logistics / Courier',
    title: 'Transport, Logistics & Logistics Fleet',
    description: 'Freight, goods delivery, courier, or passenger transportation service.',
    requiresStore: false,
    requiresLicense: true,
    requiresTaxId: true,
    customFields: [
      { id: 'fleetType', label: 'Fleet Type', type: 'text', required: true, placeholder: 'Trucks, Vans, Bikes, Cargo' },
      { id: 'serviceCoverage', label: 'Service Coverage', type: 'select', required: true, options: ['Local City', 'Statewide', 'National', 'International'] }
    ]
  },

  // Agriculture & Production
  'agriculture_farmer': {
    category: 'agriculture_production',
    businessType: 'Agriculture / Organic Farm',
    title: 'Farmer, Agriculture & Dairy Produce',
    description: 'Agricultural produce, organic farming, dairy, poultry, or fisheries.',
    requiresStore: true,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'cropProduceTypes', label: 'Crops / Produce Offered', type: 'text', required: true, placeholder: 'Organic Vegetables, Dairy, Fruits' },
      { id: 'organicCertified', label: 'Organic Certified', type: 'boolean', required: false }
    ]
  },

  // Technology & Freelancer
  'freelancer_consultant': {
    category: 'technology_creative',
    businessType: 'Freelancer / Independent Contractor',
    title: 'Freelancer, Digital Creator or Consultant',
    description: 'Software development, design, digital marketing, content, or business consulting.',
    requiresStore: false,
    requiresLicense: false,
    requiresTaxId: false,
    customFields: [
      { id: 'skillsList', label: 'Core Skills & Services', type: 'text', required: true, placeholder: 'React, UI Design, SEO, Copywriting' },
      { id: 'portfolioUrl', label: 'Portfolio Link', type: 'text', required: false }
    ]
  }
};
