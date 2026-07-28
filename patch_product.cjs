const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductManagement.tsx', 'utf8');

const regex = /{ label: 'Disputes\/Returns', value: '0\.0%', suffix: 'Disputes', color: 'text-rose-400', bg: 'bg-rose-500\/10' },\n\s*{ label: 'Operations Health', value: '99\.9%', suffix: 'Excellent', color: 'text-teal-400', bg: 'bg-teal-500\/10' },/;
code = code.replace(regex, `{ label: 'Disputes/Returns', value: 'Pending', suffix: 'Disputes', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                        { label: 'Operations Health', value: 'Pending', suffix: 'Health', color: 'text-teal-400', bg: 'bg-teal-500/10' },`);

fs.writeFileSync('src/pages/ProductManagement.tsx', code);
