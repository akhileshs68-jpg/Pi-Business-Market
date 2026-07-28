const fs = require('fs');
let code = fs.readFileSync('src/services/orderService.ts', 'utf8');

code = code.replace("return this.createOrder(orderData);\n  });", "return this.createOrder(orderData);");

fs.writeFileSync('src/services/orderService.ts', code);
