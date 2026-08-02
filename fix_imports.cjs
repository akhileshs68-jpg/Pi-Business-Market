const fs = require('fs');

let m1 = fs.readFileSync('src/pages/MarketplacePage.tsx', 'utf8');
if (!m1.includes("import { aiEngineService }")) {
  m1 = "import { aiEngineService } from '../services/aiEngineService';\n" + m1;
  fs.writeFileSync('src/pages/MarketplacePage.tsx', m1);
}

let m2 = fs.readFileSync('src/services/messagingService.ts', 'utf8');
if (!m2.includes("import { aiEngineService }")) {
  m2 = "import { aiEngineService } from './aiEngineService';\n" + m2;
  fs.writeFileSync('src/services/messagingService.ts', m2);
}

