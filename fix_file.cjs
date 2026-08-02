const fs = require('fs');
let s = fs.readFileSync('src/components/admin/MissionControlPanels.tsx', 'utf8');
if (!s.endsWith('};\n')) {
   s += '\n'; // wait, it says error TS1005: '}' expected.
}
// I'll just append }
fs.writeFileSync('src/components/admin/MissionControlPanels.tsx', s);
