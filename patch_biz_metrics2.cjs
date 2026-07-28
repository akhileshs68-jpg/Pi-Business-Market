const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

const regexAreaChart = /<svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">[\s\S]*?<\/svg>/;
code = code.replace(regexAreaChart, `<svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                          <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(30, 41, 59, 1)" strokeWidth="1" />
                          <text x="300" y="100" fill="rgba(148, 163, 184, 0.5)" fontSize="12" textAnchor="middle">No historical revenue data available</text>
                        </svg>`);

const regexMiniChart = /<svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">[\s\S]*?<\/svg>/;
code = code.replace(regexMiniChart, `<div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Live data pending</div>`);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
