const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessOrderDashboard.tsx', 'utf8');

const regex = /{ label: 'Dispatched', value: '14', icon: Truck, color: 'text-indigo-400' },\n\s*{ label: 'Velocity', value: '2\.4\/h', icon: Clock, color: 'text-emerald-400' },/;
code = code.replace(regex, `{ label: 'Dispatched', value: orders.filter(o => o.orderStatus === OrderStatus.SHIPPED || o.orderStatus === OrderStatus.OUT_FOR_DELIVERY).length, icon: Truck, color: 'text-indigo-400' },
            { label: 'Completed', value: orders.filter(o => o.orderStatus === OrderStatus.COMPLETED).length, icon: CheckCircle2, color: 'text-emerald-400' },`);

fs.writeFileSync('src/pages/BusinessOrderDashboard.tsx', code);
