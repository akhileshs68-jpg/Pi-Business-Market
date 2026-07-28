const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

if (!code.includes('Briefcase,')) {
  code = code.replace(/import \{[\s\S]*?\} from 'lucide-react';/, (match) => {
    return match.replace(/import \{/, 'import { Briefcase,');
  });
  fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
}
