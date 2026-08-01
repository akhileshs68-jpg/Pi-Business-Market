import fs from 'fs';
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(
  /const paymentId = await paymentService\.createTransaction\(\{\s*buyerId: user\.uid,\s*businessId: businessId,\s*orderId: session\.sessionId,\s*currency: 'Pi', \/\/ Or whatever currency is configured\s*paymentMethod: 'pi',\s*amount: grandTotal\s*\}\);/,
  `const paymentId = await paymentService.createTransaction({
        userId: user.uid,
        sellerId: session.storeId || session.businessId || businessId,
        businessId: businessId,
        storeId: session.storeId || businessId,
        orderId: session.sessionId,
        productIds: orderItems.map(i => i.productId),
        currency: 'PI_TEST',
        paymentMethod: 'pi',
        amount: grandTotal
      });`
);

content = content.replace(
  /await paymentService\.updateTransactionStatus\(paymentId, 'Completed', txid\);\s*\/\/\ 2\.\ Save the order in Firestore/,
  `await paymentService.updateTransactionStatus(paymentId, 'Completed', txid);
            await paymentService.recordPaymentHistory(paymentId);
            
            // Deduct inventory
            try {
              const { productService } = await import('../services/productService');
              for (const item of orderItems) {
                await productService.updateStock(item.productId, -item.quantity);
              }
            } catch (invErr) {
              console.error('Inventory update failed', invErr);
            }
            
            // 2. Save the order in Firestore`
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
