const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(/export interface SearchFilters \{[\s\S]*?\}/, `export interface SearchFilters {
  entityType?: SearchEntityType;
  businessId?: string;
  storeId?: string;
  categoryId?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  businessType?: string;
  minRating?: number;
  isVerified?: boolean;
}`);

fs.writeFileSync('src/types.ts', code);
