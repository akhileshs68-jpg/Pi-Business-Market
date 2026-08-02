const fs = require('fs');
['src/security/fraudDetectionService.ts', 'src/security/zeroTrustService.ts'].forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  let newS = [];
  let lines = s.split('\n');
  for (let i=0; i<lines.length; i++) {
    if (lines[i].trim() === '}' && lines[i+1] && lines[i+1].trim() === '},') {
      newS.push(lines[i+1]);
      i++;
    } else {
      newS.push(lines[i]);
    }
  }
  fs.writeFileSync(f, newS.join('\n'));
});

let f3 = 'src/components/admin/MissionControlPanels.tsx';
let s3 = fs.readFileSync(f3, 'utf8');
if (!s3.trim().endsWith(');')) {
  s3 += '\n  </div>\n  );\n};\n';
}
fs.writeFileSync(f3, s3);
