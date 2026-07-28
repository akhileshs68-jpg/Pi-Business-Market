const fs = require('fs');
let code = fs.readFileSync('src/components/business/BusinessWizard.tsx', 'utf8');

const importStart = code.indexOf("import {");
const importEnd = code.indexOf("} from 'lucide-react';") + "} from 'lucide-react';".length;

const newImports = `import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Image as ImageIcon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  Briefcase,
  User,
  Zap,
  Info,
  X,
  Plus,
  ArrowRight,
  FileText,
  ShoppingCart,
  Wrench,
  Factory,
  Tractor,
  Store,
  Palette,
  Truck,
  HeartPulse,
  GraduationCap,
  Utensils,
  HardHat,
  MoreHorizontal
} from 'lucide-react';`;

code = code.substring(0, importStart) + newImports + code.substring(importEnd);

const listStart = code.indexOf('const BUSINESS_TYPES = [');
const listEnd = code.indexOf('];', listStart) + 2;

const newList = `const BUSINESS_TYPES = [
  { id: 'Product Seller', label: 'Product Seller', icon: ShoppingCart, desc: 'Sell physical or digital products.' },
  { id: 'Service Provider', label: 'Service Provider', icon: Wrench, desc: 'Offer skills or services to customers.' },
  { id: 'Manufacturer', label: 'Manufacturer', icon: Factory, desc: 'Manufacture goods for wholesale or retail.' },
  { id: 'Freelancer', label: 'Freelancer', icon: User, desc: 'Independent professional offering specialized skills.' },
  { id: 'Professional', label: 'Professional', icon: Briefcase, desc: 'Consulting, accounting, legal, and more.' },
  { id: 'Farmer / Agriculture', label: 'Farmer / Agriculture', icon: Tractor, desc: 'Agriculture, farming, and organic produce.' },
  { id: 'Local Shop', label: 'Local Shop', icon: Store, desc: 'Retail store, grocery, or local boutique.' },
  { id: 'Company', label: 'Company', icon: Building2, desc: 'Registered corporate entity or agency.' },
  { id: 'Startup', label: 'Startup', icon: Zap, desc: 'Fast-growing tech or innovative business.' },
  { id: 'NGO', label: 'NGO', icon: ShieldCheck, desc: 'Non-profit, charity, or social enterprise.' },
  { id: 'Artist / Creator', label: 'Artist / Creator', icon: Palette, desc: 'Artists, musicians, creators, and crafters.' },
  { id: 'Distributor', label: 'Distributor', icon: Truck, desc: 'Supply chain distribution and logistics.' },
  { id: 'Wholesaler', label: 'Wholesaler', icon: Building2, desc: 'B2B seller of bulk goods and materials.' },
  { id: 'Transport', label: 'Transport', icon: Truck, desc: 'Logistics, delivery, and transportation.' },
  { id: 'Education', label: 'Education', icon: GraduationCap, desc: 'Schools, tutoring, and educational courses.' },
  { id: 'Healthcare', label: 'Healthcare', icon: HeartPulse, desc: 'Medical professionals, clinics, and wellness.' },
  { id: 'Hospitality', label: 'Hospitality', icon: Utensils, desc: 'Restaurants, cafes, hotels, and events.' },
  { id: 'Construction', label: 'Construction', icon: HardHat, desc: 'Building, architecture, and contracting.' },
  { id: 'Repair Services', label: 'Repair Services', icon: Wrench, desc: 'Electronics, automotive, and appliance repair.' },
  { id: 'Other', label: 'Other', icon: MoreHorizontal, desc: 'Other types of businesses not listed.' }
];`;

code = code.substring(0, listStart) + newList + code.substring(listEnd);

fs.writeFileSync('src/components/business/BusinessWizard.tsx', code);
console.log('Replaced imports and BUSINESS_TYPES.');
