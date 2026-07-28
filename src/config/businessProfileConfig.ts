export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'boolean' | 'location';
  options?: string[]; // for select
  required?: boolean;
  placeholder?: string;
}

export interface RoleProfileConfig {
  roleId: string;
  generalFields: FormField[];
  specificFields: FormField[];
}

const commonGeneralFields: FormField[] = [
  { name: 'businessName', label: 'Business Name', type: 'text', required: true },
  { name: 'category', label: 'Business Category', type: 'text', required: true },
  { name: 'description', label: 'Business Description', type: 'textarea', required: true },
  { name: 'address', label: 'Business Address', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'postalCode', label: 'Postal Code', type: 'text' },
  { name: 'phone', label: 'Business Phone', type: 'text' },
  { name: 'email', label: 'Business Email', type: 'text' },
  { name: 'website', label: 'Website', type: 'url' },
  { name: 'socialLinks', label: 'Social Links', type: 'text' }, // could be complex, simple text for now
  { name: 'businessHours', label: 'Business Hours', type: 'text' },
  { name: 'location', label: 'Location (Latitude & Longitude)', type: 'location' }
];

export const BUSINESS_PROFILE_CONFIG: Record<string, RoleProfileConfig> = {
  seller: {
    roleId: 'seller',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'storeName', label: 'Store Name', type: 'text' },
      { name: 'storeType', label: 'Store Type', type: 'text' },
      { name: 'productCategories', label: 'Product Categories', type: 'text' },
      { name: 'deliveryAvailable', label: 'Delivery Available', type: 'boolean' },
      { name: 'pickupAvailable', label: 'Pickup Available', type: 'boolean' },
      { name: 'returnPolicy', label: 'Return Policy', type: 'textarea' },
    ]
  },
  'service provider': {
    roleId: 'service provider',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'serviceName', label: 'Service Name', type: 'text' },
      { name: 'servicesOffered', label: 'Services Offered', type: 'text' },
      { name: 'pricingType', label: 'Pricing Type', type: 'text' },
      { name: 'workingHours', label: 'Working Hours', type: 'text' },
      { name: 'bookingAvailable', label: 'Booking Available', type: 'boolean' },
      { name: 'serviceArea', label: 'Service Area', type: 'text' },
    ]
  },
  manufacturer: {
    roleId: 'manufacturer',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'factoryName', label: 'Factory Name', type: 'text' },
      { name: 'manufacturingCategories', label: 'Manufacturing Categories', type: 'text' },
      { name: 'productionCapacity', label: 'Production Capacity', type: 'text' },
      { name: 'minimumOrderQuantity', label: 'Minimum Order Quantity', type: 'text' },
      { name: 'wholesaleAvailable', label: 'Wholesale Available', type: 'boolean' },
    ]
  },
  farmer: {
    roleId: 'farmer',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'farmName', label: 'Farm Name', type: 'text' },
      { name: 'farmProducts', label: 'Farm Products', type: 'text' },
      { name: 'organicCertified', label: 'Organic Certified', type: 'boolean' },
      { name: 'harvestSeason', label: 'Harvest Season', type: 'text' },
      { name: 'deliveryRadius', label: 'Delivery Radius', type: 'text' },
    ]
  },
  artist: {
    roleId: 'artist',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'artistName', label: 'Artist Name', type: 'text' },
      { name: 'artCategories', label: 'Art Categories', type: 'text' },
      { name: 'portfolio', label: 'Portfolio', type: 'url' },
      { name: 'commissionAvailable', label: 'Commission Available', type: 'boolean' },
      { name: 'exhibitions', label: 'Exhibitions', type: 'text' },
    ]
  },
  freelancer: {
    roleId: 'freelancer',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'profession', label: 'Profession', type: 'text' },
      { name: 'skills', label: 'Skills', type: 'text' },
      { name: 'experience', label: 'Experience', type: 'text' },
      { name: 'hourlyRate', label: 'Hourly Rate', type: 'text' },
      { name: 'portfolio', label: 'Portfolio', type: 'url' },
      { name: 'availability', label: 'Availability', type: 'text' },
    ]
  },
  company: {
    roleId: 'company',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'companyName', label: 'Company Name', type: 'text' },
      { name: 'industry', label: 'Industry', type: 'text' },
      { name: 'gstNumber', label: 'GST / Tax Number', type: 'text' },
      { name: 'registrationNumber', label: 'Registration Number', type: 'text' },
      { name: 'companySize', label: 'Company Size', type: 'text' },
      { name: 'departments', label: 'Departments', type: 'text' },
      { name: 'officialWebsite', label: 'Official Website', type: 'url' },
    ]
  },
  doctor: {
    roleId: 'doctor',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'clinicName', label: 'Clinic Name', type: 'text' },
      { name: 'specialization', label: 'Specialization', type: 'text' },
      { name: 'qualifications', label: 'Qualifications', type: 'text' },
      { name: 'experience', label: 'Experience', type: 'text' },
      { name: 'consultationFee', label: 'Consultation Fee', type: 'text' },
      { name: 'clinicHours', label: 'Clinic Hours', type: 'text' },
      { name: 'appointmentAvailable', label: 'Appointment Available', type: 'boolean' },
      { name: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
    ]
  },
  teacher: {
    roleId: 'teacher',
    generalFields: commonGeneralFields,
    specificFields: [
      { name: 'institutionName', label: 'Institution Name', type: 'text' },
      { name: 'subjects', label: 'Subjects', type: 'text' },
      { name: 'classes', label: 'Classes', type: 'text' },
      { name: 'experience', label: 'Experience', type: 'text' },
      { name: 'qualifications', label: 'Qualifications', type: 'text' },
      { name: 'teachingMode', label: 'Teaching Mode', type: 'text' },
      { name: 'onlineAvailable', label: 'Online Available', type: 'boolean' },
      { name: 'offlineAvailable', label: 'Offline Available', type: 'boolean' },
    ]
  }
};
