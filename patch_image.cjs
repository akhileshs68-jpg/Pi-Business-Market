const fs = require('fs');

let c = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');
c = c.replace(/item\.image/g, 'item.imageUrl');
fs.writeFileSync('src/pages/Checkout.tsx', c);

c = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');
c = c.replace(/product\.metadata\.image/g, 'product.metadata.imageUrl');
c = c.replace(/image: product\.metadata\.imageUrl,/g, 'imageUrl: product.metadata.imageUrl,');
fs.writeFileSync('src/pages/ProductDetails.tsx', c);

c = fs.readFileSync('src/components/cart/CartDrawer.tsx', 'utf8');
c = c.replace(/item\.image/g, 'item.imageUrl');
fs.writeFileSync('src/components/cart/CartDrawer.tsx', c);

