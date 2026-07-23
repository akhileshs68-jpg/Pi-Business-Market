/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { catalogService } from './catalogService';

export const seederService = {
  async seedCatalog() {
    try {
      // 1. Create Root Categories
      const rootCats = [
        { name: 'Electronics', slug: 'electronics', icon: '💻', description: 'Computing, mobile devices, and gadgets' },
        { name: 'Fashion', slug: 'fashion', icon: '👕', description: 'Clothing, footwear, and accessories' },
        { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', description: 'Furniture, appliances, and decor' },
        { name: 'Services', slug: 'services', icon: '🛠️', description: 'Professional and technical services' },
        { name: 'Real Estate', slug: 'real-estate', icon: '🏢', description: 'Properties, rentals, and land' }
      ];

      const catIds: Record<string, string> = {};
      for (const cat of rootCats) {
        catIds[cat.slug] = await catalogService.createCategory({
          ...cat,
          level: 0,
          sortOrder: 0,
          status: 'active',
          visibility: 'public',
          featured: true
        });
      }

      // 2. Create Subcategories
      const subCats = [
        { name: 'Mobile Phones', slug: 'mobile-phones', parentSlug: 'electronics', icon: '📱' },
        { name: 'Laptops', slug: 'laptops', parentSlug: 'electronics', icon: '💻' },
        { name: 'Men\'s Wear', slug: 'mens-wear', parentSlug: 'fashion', icon: '👔' },
        { name: 'Women\'s Wear', slug: 'womens-wear', parentSlug: 'fashion', icon: '👗' }
      ];

      for (const sub of subCats) {
        await catalogService.createCategory({
          name: sub.name,
          slug: sub.slug,
          description: `All your ${sub.name} in one place`,
          icon: sub.icon,
          parentId: catIds[sub.parentSlug],
          level: 1,
          sortOrder: 0,
          status: 'active',
          visibility: 'public',
          featured: false
        });
      }

      // 3. Create Attribute Groups
      const groups = [
        { name: 'General', slug: 'general', displayOrder: 1 },
        { name: 'Technical', slug: 'technical', displayOrder: 2 },
        { name: 'Physical', slug: 'physical', displayOrder: 3 },
        { name: 'Performance', slug: 'performance', displayOrder: 4 }
      ];

      const groupIds: Record<string, string> = {};
      for (const g of groups) {
        groupIds[g.slug] = await catalogService.createAttributeGroup({
          ...g,
          status: 'active'
        });
      }

      // 4. Create Attributes
      const attrs = [
        { name: 'Brand', slug: 'brand', dataType: 'text', group: 'general', required: true },
        { name: 'Model', slug: 'model', dataType: 'text', group: 'general', required: true },
        { name: 'Weight', slug: 'weight', dataType: 'weight', unit: 'kg', group: 'physical', required: false },
        { name: 'Dimensions', slug: 'dimensions', dataType: 'dimension', group: 'physical', required: false },
        { name: 'Color', slug: 'color', dataType: 'color', group: 'physical', required: false },
        { name: 'Processor', slug: 'processor', dataType: 'text', group: 'technical', required: false },
        { name: 'RAM', slug: 'ram', dataType: 'size', unit: 'GB', group: 'technical', required: false },
        { name: 'Storage', slug: 'storage', dataType: 'size', unit: 'GB', group: 'technical', required: false }
      ];

      for (const attr of attrs) {
        await catalogService.createAttribute({
          name: attr.name,
          slug: attr.slug,
          dataType: attr.dataType as any,
          unit: attr.unit,
          groupId: groupIds[attr.group],
          required: attr.required,
          filterable: true,
          searchable: true,
          comparable: true,
          variantAttribute: false,
          displayOrder: 0,
          status: 'active'
        });
      }

    } catch (err) {
      console.error('Seeding failed:', err);
    }
  }
};
