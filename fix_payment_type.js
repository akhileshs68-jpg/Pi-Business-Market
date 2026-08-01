import fs from 'fs';
let content = fs.readFileSync('src/types/payment.ts', 'utf8');

content = content.replace(
  /buyerId: string;/,
  `userId: string;
  sellerId: string;`
);

content = content.replace(
  /orderId\?: string;\n  bookingId\?: string;/,
  `storeId: string;
  orderId?: string;
  productIds?: string[];
  bookingId?: string;`
);

fs.writeFileSync('src/types/payment.ts', content);
