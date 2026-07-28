const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

if (!code.includes('Briefcase')) {
  // Just safety
}

code = code.replace(/import \{/, 'import { Briefcase, ');

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
