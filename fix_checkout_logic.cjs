const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const oldLogicRegex = /\/\/ 3\. Create Payment Intent[\s\S]*?(?=catch \(err\))/;
const newLogic = `// 3. Create Transaction in Payment Engine
      const paymentId = await paymentService.createTransaction({
        buyerId: user.uid,
        businessId: order.businessId,
        orderId: order.orderId,
        currency: 'Pi', // Or whatever currency is configured
        paymentMethod: selectedPaymentMethod,
        amount: order.grandTotal
      });

      if (selectedPaymentMethod === 'pi') {
        // 4. Launch Pi SDK Payment (U2A Payment Flow)
        await paymentService.processPiPayment(
          paymentId,
          order.grandTotal,
          \`Order \${order.orderNumber} at Pi Business Market\`,
          {
            productType: 'MarketplaceOrder',
            orderId: order.orderId,
            storeId: order.businessId,
            itemsCount: orderItems.length
          },
          async (txid) => {
            // Success callback
            await checkoutService.updateSession(session.sessionId, { status: 'completed' });
            await cartService.clearCart(session.cartId);
            navigate(\`/order-success/\${orderId}\`);
          },
          (err) => {
            // Error callback
            console.error('[Checkout] Payment verification failed:', err);
            setIsProcessing(false);
          }
        );
      } else {
        // Handle future or alternative payment methods (e.g., BMT, UPI, Cash)
        // For now, simulate success for demo if it's not Pi (though Pi is the only enabled one right now)
        await paymentService.updateTransactionStatus(paymentId, 'Completed', 'simulated_tx');
        await orderService.updatePaymentStatus(order.orderId, 'Paid');
        await checkoutService.updateSession(session.sessionId, { status: 'completed' });
        await cartService.clearCart(session.cartId);
        navigate(\`/order-success/\${orderId}\`);
      }
    } `;

content = content.replace(oldLogicRegex, newLogic);

fs.writeFileSync('src/pages/Checkout.tsx', content);
