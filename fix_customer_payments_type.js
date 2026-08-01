import fs from 'fs';
let content = fs.readFileSync('src/pages/CustomerPayments.tsx', 'utf8');

content = content.replace(
  /import \{ Payment \} from '\.\.\/types';/,
  `import { PaymentRecord } from '../types/payment';`
);

content = content.replace(
  /useState<Payment\[\]>\(\[\]\);/,
  `useState<PaymentRecord[]>([])`
);

fs.writeFileSync('src/pages/CustomerPayments.tsx', content);
