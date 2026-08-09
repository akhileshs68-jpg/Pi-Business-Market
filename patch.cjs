const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetLine = `      if (cartItems.length === 0) {
        cartItems = [{
          itemId: sessionData.productId || \`item_\${Date.now()}\`,
          productId: sessionData.productId || 'prod_default',
          name: metadata?.productName || sessionData.productName || 'Pi Product Item',
          quantity: sessionData.quantity || 1,
          unitPrice: sessionData.price || grandTotal || 0,
          subtotal: grandTotal || 0
        }];
      }`;

const injectedLogic = `
      // ---------------------------------------------------------
      // PHASE 5B.1: AUTHORITATIVE PRICING VERIFICATION
      // ---------------------------------------------------------
      let authoritativeSubtotal = 0;
      let authoritativeShipping = sessionData.shipping ?? sessionData.shippingCharge ?? 0;
      let authoritativeTax = sessionData.tax ?? 0;
      let authoritativeDiscount = sessionData.discount ?? 0;

      if (db) {
        for (let i = 0; i < cartItems.length; i++) {
          let item = cartItems[i];
          if (item.productId && item.productId !== 'prod_default') {
            try {
              let authoritativePrice = item.unitPrice || item.price || 0;
              let authoritativeName = item.name;
              
              if (item.variantId) {
                const variantRef = db.collection('productVariants').doc(item.variantId);
                const variantSnap = await variantRef.get();
                if (variantSnap.exists) {
                  const vData = variantSnap.data();
                  authoritativePrice = vData.price;
                  if (vData.variantName) authoritativeName = vData.variantName;
                }
              } else {
                const productRef = db.collection('products').doc(item.productId);
                const productSnap = await productRef.get();
                if (productSnap.exists) {
                  const pData = productSnap.data();
                  authoritativePrice = pData.price;
                  if (pData.productName) authoritativeName = pData.productName;
                }
              }

              item.unitPrice = authoritativePrice;
              item.price = authoritativePrice;
              item.name = authoritativeName;
              item.subtotal = authoritativePrice * (item.quantity || 1);
              authoritativeSubtotal += item.subtotal;
            } catch (e) {
              console.error(\`[Security Alert] Failed to fetch authoritative pricing for productId: \${item.productId}\`, e);
              authoritativeSubtotal += item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1);
            }
          } else {
             authoritativeSubtotal += item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1);
          }
        }
      } else {
         authoritativeSubtotal = cartItems.reduce((acc, item) => acc + (item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
      }

      const authoritativeGrandTotal = authoritativeSubtotal + authoritativeTax + authoritativeShipping - authoritativeDiscount;
      const paidAmount = parseFloat(paymentData?.amount || metadata?.amount || 0);
      
      if (paidAmount < authoritativeGrandTotal - 0.001) {
          console.error(\`[Security Alert] Payment amount \${paidAmount} is less than authoritative grand total \${authoritativeGrandTotal}!\`);
          throw new Error(\`Payment verification failed: Paid amount \${paidAmount} does not match required total \${authoritativeGrandTotal}\`);
      }
      
      sessionData.grandTotal = authoritativeGrandTotal;
      sessionData.subtotal = authoritativeSubtotal;
      sessionData.shipping = authoritativeShipping;
      sessionData.tax = authoritativeTax;
      sessionData.discount = authoritativeDiscount;
      // ---------------------------------------------------------
`;

if (content.includes(targetLine)) {
    content = content.replace(targetLine, targetLine + "\n" + injectedLogic);
    fs.writeFileSync('server.ts', content);
    console.log('Successfully patched server.ts');
} else {
    console.error('Target line not found in server.ts');
}
