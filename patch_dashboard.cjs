const fs = require('fs');
let content = fs.readFileSync('src/pages/BusinessOrderDashboard.tsx', 'utf8');

const targetFilterLine = `    { label: 'New / Pending', value: OrderStatus.PENDING_PAYMENT },`;
if (content.includes(targetFilterLine)) {
    content = content.replace(targetFilterLine, `    { label: 'New', value: OrderStatus.NEW_ORDER },`);
    fs.writeFileSync('src/pages/BusinessOrderDashboard.tsx', content);
    console.log('Successfully patched BusinessOrderDashboard.tsx');
} else {
    console.error('Target filter line not found in BusinessOrderDashboard.tsx');
}
