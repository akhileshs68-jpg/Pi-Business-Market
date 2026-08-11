export interface WorkspaceModule {
  id: string;
  label: string;
  iconName: string;
  description: string;
  path: string;
}

export interface RoleWorkspaceConfig {
  roleId: string;
  title: string;
  modules: WorkspaceModule[];
}

export const WORKSPACE_CONFIG: Record<string, RoleWorkspaceConfig> = {
  buyer: {
    roleId: 'buyer',
    title: 'Buyer Dashboard',
    modules: []
  },
  seller: {
    roleId: 'seller',
    title: 'Seller Workspace',
    modules: [
      { id: 'products', label: 'Products', iconName: 'ShoppingBag', description: 'Manage your catalog', path: '/store-dashboard' },
      { id: 'marketing', label: 'Marketing & Ads', iconName: 'Megaphone', description: 'Promote products & create campaigns', path: '/store-dashboard?tab=marketing' },
      { id: 'inventory', label: 'Inventory', iconName: 'ClipboardList', description: 'Stock levels', path: '/inventory' },
      { id: 'orders', label: 'Orders', iconName: 'Clock', description: 'Fulfillment', path: '/business-orders' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Payments & Earnings', path: '/business-payments' },
    ]
  },
  'service provider': {
    roleId: 'service provider',
    title: 'Service Workspace',
    modules: [
      { id: 'services', label: 'Services', iconName: 'Briefcase', description: 'Manage offerings', path: '/services' },
      { id: 'marketing', label: 'Marketing & Ads', iconName: 'Megaphone', description: 'Promote services & create campaigns', path: '/store-dashboard?tab=marketing' },
      { id: 'bookings', label: 'Bookings', iconName: 'Calendar', description: 'Schedule', path: '/business-orders' },
      { id: 'clients', label: 'Clients', iconName: 'Users', description: 'CRM', path: '/crm' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Payments', path: '/business-payments' },
    ]
  },
  'service_provider': {
    roleId: 'service_provider',
    title: 'Service Workspace',
    modules: [
      { id: 'services', label: 'Services', iconName: 'Briefcase', description: 'Manage offerings', path: '/services' },
      { id: 'marketing', label: 'Marketing & Ads', iconName: 'Megaphone', description: 'Promote services & create campaigns', path: '/store-dashboard?tab=marketing' },
      { id: 'bookings', label: 'Bookings', iconName: 'Calendar', description: 'Schedule', path: '/business-orders' },
      { id: 'clients', label: 'Clients', iconName: 'Users', description: 'CRM', path: '/crm' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Payments', path: '/business-payments' },
    ]
  },
  manufacturer: {
    roleId: 'manufacturer',
    title: 'Manufacturer Workspace',
    modules: [
      { id: 'production', label: 'Production', iconName: 'Briefcase', description: 'Manufacturing lines', path: '/store-dashboard' },
      { id: 'marketing', label: 'Marketing & Ads', iconName: 'Megaphone', description: 'B2B Advertising & Campaigns', path: '/store-dashboard?tab=marketing' },
      { id: 'inventory', label: 'Inventory', iconName: 'ClipboardList', description: 'Materials & Stock', path: '/inventory' },
      { id: 'orders', label: 'Orders', iconName: 'Clock', description: 'B2B Orders', path: '/business-orders' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Payments', path: '/business-payments' },
    ]
  },
  farmer: {
    roleId: 'farmer',
    title: 'Farmer Workspace',
    modules: [
      { id: 'crops', label: 'Crops & Produce', iconName: 'Star', description: 'Farm yield', path: '/store-dashboard' },
      { id: 'inventory', label: 'Inventory', iconName: 'ClipboardList', description: 'Storage', path: '/inventory' },
      { id: 'orders', label: 'Orders', iconName: 'Clock', description: 'Deliveries', path: '/business-orders' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Revenue', path: '/business-payments' },
    ]
  },
  artist: {
    roleId: 'artist',
    title: 'Artist Workspace',
    modules: [
      { id: 'portfolio', label: 'Portfolio', iconName: 'Briefcase', description: 'Artworks', path: '/store-dashboard' },
      { id: 'commissions', label: 'Commissions', iconName: 'FileText', description: 'Custom requests', path: '/business-orders' },
      { id: 'exhibitions', label: 'Exhibitions', iconName: 'Calendar', description: 'Events', path: '/services' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Earnings', path: '/business-payments' },
    ]
  },
  freelancer: {
    roleId: 'freelancer',
    title: 'Freelancer Workspace',
    modules: [
      { id: 'gigs', label: 'Gigs', iconName: 'Briefcase', description: 'Active projects', path: '/services' },
      { id: 'clients', label: 'Clients', iconName: 'Users', description: 'Network', path: '/crm' },
      { id: 'invoices', label: 'Invoices', iconName: 'FileText', description: 'Billing', path: '/business-payments' },
      { id: 'contracts', label: 'Contracts', iconName: 'CheckCircle2', description: 'Agreements', path: '/business-orders' },
    ]
  },
  company: {
    roleId: 'company',
    title: 'Company Workspace',
    modules: [
      { id: 'departments', label: 'Departments', iconName: 'Briefcase', description: 'Org structure', path: '/store-dashboard' },
      { id: 'employees', label: 'Employees', iconName: 'Users', description: 'HR', path: '/crm' },
      { id: 'projects', label: 'Projects', iconName: 'FileText', description: 'Initiatives', path: '/services' },
      { id: 'finance', label: 'Finance', iconName: 'CreditCard', description: 'Corporate finance', path: '/business-payments' },
    ]
  },
  doctor: {
    roleId: 'doctor',
    title: 'Doctor Workspace',
    modules: [
      { id: 'appointments', label: 'Appointments', iconName: 'Calendar', description: 'Schedule', path: '/business-orders' },
      { id: 'patients', label: 'Patients', iconName: 'Users', description: 'Records', path: '/crm' },
      { id: 'prescriptions', label: 'Prescriptions', iconName: 'FileText', description: 'Rx management', path: '/services' },
      { id: 'payments', label: 'Payments', iconName: 'CreditCard', description: 'Billing', path: '/business-payments' },
    ]
  },
  teacher: {
    roleId: 'teacher',
    title: 'Teacher Workspace',
    modules: [
      { id: 'courses', label: 'Courses', iconName: 'BookOpen', description: 'Curriculum', path: '/store-dashboard' },
      { id: 'students', label: 'Students', iconName: 'Users', description: 'Roster', path: '/crm' },
      { id: 'attendance', label: 'Attendance', iconName: 'CheckCircle2', description: 'Records', path: '/business-orders' },
      { id: 'assignments', label: 'Assignments', iconName: 'FileText', description: 'Grading', path: '/services' },
    ]
  }
};
