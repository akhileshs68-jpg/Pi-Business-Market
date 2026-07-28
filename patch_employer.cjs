const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployerDashboard.tsx', 'utf8');

const regex = /{ label: 'Total Applicants', value: '124', icon: Users, color: 'text-violet-400' },\n\s*{ label: 'Interviews Slated', value: '12', icon: Calendar, color: 'text-emerald-400' },\n\s*{ label: 'Pipeline Velocity', value: '88%', icon: Layers, color: 'text-amber-400' },/;
code = code.replace(regex, `{ label: 'Total Applicants', value: 'Live data pending', icon: Users, color: 'text-violet-400' },
            { label: 'Interviews Slated', value: 'Live data pending', icon: Calendar, color: 'text-emerald-400' },
            { label: 'Pipeline Velocity', value: 'Live data pending', icon: Layers, color: 'text-amber-400' },`);

fs.writeFileSync('src/pages/EmployerDashboard.tsx', code);
