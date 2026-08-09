export interface TaxonomyItem {
  id: string;
  name: string;
  subcategories?: TaxonomyItem[];
}

export const PRODUCT_TAXONOMY: TaxonomyItem[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    subcategories: [
      {
        id: 'smartphones',
        name: 'Smartphones & Accessories',
        subcategories: [
          { id: 'phones', name: 'Mobile Phones' },
          { id: 'chargers', name: 'Chargers & Cables' },
          { id: 'cases', name: 'Cases & Covers' }
        ]
      },
      {
        id: 'computers',
        name: 'Computers & Laptops',
        subcategories: [
          { id: 'laptops', name: 'Laptops' },
          { id: 'desktops', name: 'Desktops' },
          { id: 'accessories', name: 'Computer Accessories' }
        ]
      },
      {
        id: 'audio',
        name: 'Audio & Video',
        subcategories: [
          { id: 'headphones', name: 'Headphones & Earphones' },
          { id: 'speakers', name: 'Speakers' }
        ]
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    subcategories: [
      {
        id: 'men',
        name: 'Men\'s Clothing',
        subcategories: [
          { id: 'shirts', name: 'Shirts' },
          { id: 'tshirts', name: 'T-Shirts' },
          { id: 'jeans', name: 'Jeans' }
        ]
      },
      {
        id: 'women',
        name: 'Women\'s Clothing',
        subcategories: [
          { id: 'dresses', name: 'Dresses' },
          { id: 'tops', name: 'Tops' },
          { id: 'accessories_women', name: 'Accessories' }
        ]
      },
      {
        id: 'kids',
        name: 'Kids\' Clothing',
        subcategories: [
          { id: 'boys', name: 'Boys' },
          { id: 'girls', name: 'Girls' },
          { id: 'baby', name: 'Baby' }
        ]
      }
    ]
  },
  {
    id: 'home_garden',
    name: 'Home & Garden',
    subcategories: [
      {
        id: 'furniture',
        name: 'Furniture',
        subcategories: [
          { id: 'chairs_tables', name: 'Chairs & Tables' },
          { id: 'sofas', name: 'Sofas' },
          { id: 'beds', name: 'Beds' }
        ]
      },
      {
        id: 'decor',
        name: 'Home Decor',
        subcategories: [
          { id: 'lighting', name: 'Lighting' },
          { id: 'wall_art', name: 'Wall Art' }
        ]
      }
    ]
  },
  {
    id: 'food_beverage',
    name: 'Food & Beverage',
    subcategories: [
      {
        id: 'beverages',
        name: 'Beverages',
        subcategories: [
          { id: 'coffee', name: 'Coffee & Tea' },
          { id: 'juices', name: 'Juices & Soda' }
        ]
      },
      {
        id: 'snacks',
        name: 'Snacks & Sweets',
        subcategories: [
          { id: 'chocolates', name: 'Chocolates' },
          { id: 'bakery', name: 'Bakery Items' }
        ]
      }
    ]
  }
];

export const SERVICE_TAXONOMY: TaxonomyItem[] = [
  {
    id: 'digital_services',
    name: 'Digital Services',
    subcategories: [
      {
        id: 'web_dev',
        name: 'Web Development',
        subcategories: [
          { id: 'frontend', name: 'Frontend Development' },
          { id: 'backend', name: 'Backend Development' },
          { id: 'fullstack', name: 'Fullstack Development' }
        ]
      },
      {
        id: 'design',
        name: 'Design & Creative',
        subcategories: [
          { id: 'graphic_design', name: 'Graphic Design' },
          { id: 'ui_ux', name: 'UI/UX Design' },
          { id: 'branding', name: 'Branding & Logos' }
        ]
      },
      {
        id: 'writing',
        name: 'Writing & Translation',
        subcategories: [
          { id: 'copywriting', name: 'Copywriting' },
          { id: 'translation', name: 'Translation Services' }
        ]
      }
    ]
  },
  {
    id: 'consulting',
    name: 'Consulting & Business',
    subcategories: [
      {
        id: 'finance',
        name: 'Financial Consulting',
        subcategories: [
          { id: 'tax', name: 'Tax & Accounting' },
          { id: 'investment', name: 'Investment Advisory' }
        ]
      },
      {
        id: 'marketing',
        name: 'Marketing Strategy',
        subcategories: [
          { id: 'seo', name: 'SEO & SEM' },
          { id: 'social_media', name: 'Social Media Marketing' }
        ]
      }
    ]
  },
  {
    id: 'local_services',
    name: 'Local Services',
    subcategories: [
      {
        id: 'home_maintenance',
        name: 'Home Maintenance',
        subcategories: [
          { id: 'plumbing', name: 'Plumbing' },
          { id: 'electrical', name: 'Electrical Work' },
          { id: 'cleaning', name: 'Cleaning Services' }
        ]
      },
      {
        id: 'personal_care',
        name: 'Personal Care',
        subcategories: [
          { id: 'haircut', name: 'Haircut & Styling' },
          { id: 'wellness', name: 'Wellness & Massage' }
        ]
      }
    ]
  }
];

export const findCategoryByName = (name: string, taxonomy: TaxonomyItem[]): TaxonomyItem | null => {
  const normalized = name.toLowerCase().trim();
  for (const cat of taxonomy) {
    if (cat.name.toLowerCase().trim() === normalized || cat.id.toLowerCase().trim() === normalized) {
      return cat;
    }
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        if (sub.name.toLowerCase().trim() === normalized || sub.id.toLowerCase().trim() === normalized) {
          return sub;
        }
        if (sub.subcategories) {
          for (const child of sub.subcategories) {
            if (child.name.toLowerCase().trim() === normalized || child.id.toLowerCase().trim() === normalized) {
              return child;
            }
          }
        }
      }
    }
  }
  return null;
};
