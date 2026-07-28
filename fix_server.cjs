const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/import \{ fetchMetrics \} from '\.\/get_metrics';[\s\S]*\}\);/g, '');
fs.writeFileSync('server.ts', code);
