import fs from 'fs';
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(
  /\/\/ Deduct inventory[\s\S]*?\/\/ 2\. Save the order in Firestore/,
  `// 2. Save the order in Firestore`
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
