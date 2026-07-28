const fs = require('fs');
let code = fs.readFileSync('src/pages/ServiceManagement.tsx', 'utf8');

const regex = /{ label: 'Pending Quotes', value: '4', icon: Clock, color: 'text-amber-400' },\n\s*{ label: 'Market Visibility', value: 'High', icon: Globe, color: 'text-emerald-400' },/;
code = code.replace(regex, `{ label: 'Pending Quotes', value: 'Live computation pending', icon: Clock, color: 'text-amber-400' },
              { label: 'Market Visibility', value: 'Live computation pending', icon: Globe, color: 'text-emerald-400' },`);

fs.writeFileSync('src/pages/ServiceManagement.tsx', code);
