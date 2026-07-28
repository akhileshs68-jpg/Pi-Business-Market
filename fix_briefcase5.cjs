const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(/import \{ Briefcase,  useParams, useNavigate \} from 'react-router-dom';/g, "import { useParams, useNavigate } from 'react-router-dom';");

// Make sure Briefcase is in lucide-react
if (!code.includes('Briefcase, ')) {
  code = code.replace(/import \{/, 'import { Briefcase, ');
}

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
