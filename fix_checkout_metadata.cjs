const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

if (!code.includes('transactionId: paymentId')) {
  code = code.replace(
    /itemsCount: orderItems.length/, 
    "itemsCount: orderItems.length,\n            transactionId: paymentId"
  );
  fs.writeFileSync('src/pages/Checkout.tsx', code);
}
