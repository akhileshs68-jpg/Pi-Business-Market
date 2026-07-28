const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

// Remove from react-router-dom
code = code.replace(/import \{ Briefcase,[\s\S]*?useParams/, "import { useParams");

// Add to lucide-react if missing
if (!code.includes('Briefcase,')) {
  code = code.replace(/import \{[\s\S]*?\} from 'lucide-react';/, (match) => {
    return match.replace(/import \{/, 'import { Briefcase, ');
  });
}

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
