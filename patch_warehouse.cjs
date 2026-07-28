const fs = require('fs');
let code = fs.readFileSync('src/pages/WarehouseDashboard.tsx', 'utf8');

const regex = /{ label: 'Capacity', value: '85%', icon: Activity, color: 'text-emerald-400' },\n\s*{ label: 'Shipments', value: '12', icon: Truck, color: 'text-amber-400' },\n\s*{ label: 'Coverage', value: '1,240', icon: Box, color: 'text-blue-400' },/;
code = code.replace(regex, `{ label: 'Total Value', value: 'Live computation pending', icon: Activity, color: 'text-emerald-400' },
            { label: 'Active Shipments', value: 'Live computation pending', icon: Truck, color: 'text-amber-400' },
            { label: 'Items Stored', value: 'Live computation pending', icon: Box, color: 'text-blue-400' },`);

fs.writeFileSync('src/pages/WarehouseDashboard.tsx', code);
