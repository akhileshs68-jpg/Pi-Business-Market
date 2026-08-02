const fs = require('fs');
let s = fs.readFileSync('src/components/admin/MissionControlPanels.tsx', 'utf8');
s = s.replace('  </div>\n);\nexport const BackupRecoveryPanel', '  </div>\n  );\n};\nexport const BackupRecoveryPanel');
fs.writeFileSync('src/components/admin/MissionControlPanels.tsx', s);
