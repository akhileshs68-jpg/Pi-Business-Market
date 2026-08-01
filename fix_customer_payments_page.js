import fs from 'fs';
let content = fs.readFileSync('src/pages/CustomerPayments.tsx', 'utf8');

content = content.replace(
  /const data = await paymentService\.getBusinessPayments\('PI-CORP-001'\);\s*\/\/ Filter for the current user\s*const userPayments = data\.filter\(p => p\.payerUid === user!\.uid\);/,
  `const userPayments = await paymentService.getCustomerPayments(user!.uid);`
);

content = content.replace(
  /new Date\(payment\.paidAt\)/g,
  `new Date(payment.updatedAt || payment.createdAt || Date.now())`
);

fs.writeFileSync('src/pages/CustomerPayments.tsx', content);
