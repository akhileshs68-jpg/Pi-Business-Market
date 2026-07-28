export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'boolean' | 'date' | 'time' | 'file';
  options?: string[];
  required?: boolean;
}

export interface ItemConfig {
  type: 'product' | 'service';
  commonFields: FormField[];
  roleSpecificFields: Record<string, FormField[]>;
}

export const COMMON_PRODUCT_FIELDS: FormField[] = [
  { name: 'productName', label: 'Product Name', type: 'text', required: true },
  { name: 'category', label: 'Category', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'images', label: 'Images', type: 'file' },
  { name: 'video', label: 'Video', type: 'file' },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'discount', label: 'Discount', type: 'number' },
  { name: 'currency', label: 'Currency', type: 'text' },
  { name: 'stock', label: 'Stock', type: 'number' },
  { name: 'sku', label: 'SKU', type: 'text' },
  { name: 'brand', label: 'Brand', type: 'text' },
  { name: 'tags', label: 'Tags', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Published', 'Paused', 'Out of Stock', 'Inactive'] },
];

export const COMMON_SERVICE_FIELDS: FormField[] = [
  { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
  { name: 'category', label: 'Category', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'images', label: 'Images', type: 'file' },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'duration', label: 'Duration', type: 'text' },
  { name: 'bookingRequired', label: 'Booking Required', type: 'boolean' },
  { name: 'availableDays', label: 'Available Days', type: 'text' },
  { name: 'availableTime', label: 'Available Time', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Published', 'Paused', 'Inactive'] },
];

export const PRODUCT_CONFIG: ItemConfig = {
  type: 'product',
  commonFields: COMMON_PRODUCT_FIELDS,
  roleSpecificFields: {
    seller: [
      { name: 'inventory', label: 'Inventory Details', type: 'textarea' },
      { name: 'shipping', label: 'Shipping Info', type: 'text' },
      { name: 'variants', label: 'Variants', type: 'text' },
      { name: 'returnPolicy', label: 'Return Policy', type: 'textarea' },
    ],
    manufacturer: [
      { name: 'moq', label: 'MOQ', type: 'number' },
      { name: 'productionCapacity', label: 'Production Capacity', type: 'text' },
      { name: 'wholesalePrice', label: 'Wholesale Price', type: 'number' },
      { name: 'leadTime', label: 'Lead Time', type: 'text' },
    ],
    farmer: [
      { name: 'harvestDate', label: 'Harvest Date', type: 'date' },
      { name: 'organic', label: 'Organic', type: 'boolean' },
      { name: 'freshness', label: 'Freshness', type: 'text' },
      { name: 'deliveryRadius', label: 'Delivery Radius', type: 'text' },
    ],
    artist: [
      { name: 'artworkType', label: 'Artwork Type', type: 'text' },
      { name: 'original', label: 'Original', type: 'boolean' },
      { name: 'limitedEdition', label: 'Limited Edition', type: 'boolean' },
      { name: 'commissionAvailable', label: 'Commission Available', type: 'boolean' },
    ],
    company: [
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'corporatePricing', label: 'Corporate Pricing', type: 'text' },
      { name: 'bulkOrders', label: 'Bulk Orders', type: 'boolean' },
    ]
  }
};

export const SERVICE_CONFIG: ItemConfig = {
  type: 'service',
  commonFields: COMMON_SERVICE_FIELDS,
  roleSpecificFields: {
    'service provider': [
      { name: 'serviceArea', label: 'Service Area', type: 'text' },
      { name: 'travelAvailable', label: 'Travel Available', type: 'boolean' },
      { name: 'emergencyService', label: 'Emergency Service', type: 'boolean' },
    ],
    freelancer: [
      { name: 'experience', label: 'Experience', type: 'text' },
      { name: 'portfolio', label: 'Portfolio', type: 'url' },
      { name: 'hourlyRate', label: 'Hourly Rate', type: 'number' },
      { name: 'skills', label: 'Skills', type: 'text' },
    ],
    doctor: [
      { name: 'specialization', label: 'Specialization', type: 'text' },
      { name: 'consultationMode', label: 'Consultation Mode', type: 'text' },
      { name: 'clinic', label: 'Clinic', type: 'text' },
      { name: 'onlineConsultation', label: 'Online Consultation', type: 'boolean' },
      { name: 'appointmentDuration', label: 'Appointment Duration', type: 'text' },
    ],
    teacher: [
      { name: 'subject', label: 'Subject', type: 'text' },
      { name: 'classLevel', label: 'Class Level', type: 'text' },
      { name: 'teachingMode', label: 'Teaching Mode', type: 'text' },
      { name: 'courseDuration', label: 'Course Duration', type: 'text' },
    ]
  }
};

export const getRoleType = (role: string): 'product' | 'service' => {
  if (['seller', 'manufacturer', 'farmer', 'artist', 'company'].includes(role)) {
    return 'product';
  }
  return 'service';
};

export const getConfigForRole = (role: string): { type: 'product' | 'service', common: FormField[], specific: FormField[] } => {
  const type = getRoleType(role);
  if (type === 'product') {
    return {
      type,
      common: PRODUCT_CONFIG.commonFields,
      specific: PRODUCT_CONFIG.roleSpecificFields[role] || []
    };
  } else {
    return {
      type,
      common: SERVICE_CONFIG.commonFields,
      specific: SERVICE_CONFIG.roleSpecificFields[role] || []
    };
  }
};
