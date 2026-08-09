const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStatusLine = `        orderStatus: "pending_payment",`;
if (content.includes(targetStatusLine)) {
    content = content.replace(targetStatusLine, `        orderStatus: "new_order",`);
    fs.writeFileSync('server.ts', content);
    console.log('Successfully patched server.ts status');
} else {
    console.error('Target status line not found in server.ts');
}
