const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');
code = code.replace(/} } from 'firebase\/firestore';/, "} from 'firebase/firestore';");
fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
