import fs from 'fs';
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(
  /amount: grandTotal,\n\s*timestamp: Date\.now\(\)\n\s*\}, orderItems\);/,
  `amount: grandTotal,
              currency: 'PI_TEST',
              timestamp: Date.now()
            }, orderItems);`
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
