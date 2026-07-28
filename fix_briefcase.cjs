const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(/import \{ Briefcase, useParams, useNavigate \} from 'react-router-dom';/, "import { useParams, useNavigate } from 'react-router-dom';");

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
