import fs from 'fs';
let content = fs.readFileSync('src/pages/CustomerPayments.tsx', 'utf8');

content = content.replace(
  /payment\.orderId\.slice\(0, 8\)/g,
  `(payment.orderId || payment.paymentId || '').slice(0, 8)`
);

content = content.replace(
  /onClick=\{.*?\/order-details\/\$\{payment\.orderId\}\`\)}/g,
  `onClick={() => navigate(\`/order-details/\${payment.orderId || ''}\`)}`
);

fs.writeFileSync('src/pages/CustomerPayments.tsx', content);
