const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const methodStart = "const handlePlaceOrder = async () => {";
const methodEndStr = "  if (loading) {";
const split1 = content.split(methodStart);
const split2 = split1[1].split(methodEndStr);

const newMethod = `const handlePlaceOrder = async () => {
    if (!session || !user) return;
    setIsProcessing(true);
    try {
      // 1. Map CartItems to OrderItems
      const orderItems: OrderItem[] = items.map(item => ({
        itemId: '', 
        orderId: '', 
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        tax: item.subtotal * 0.05,
        discount: 0,
        status: 'active'
      }));

      // 2. Create the real Order (Status: PENDING_PAYMENT)
      const orderId = await orderService.createFromSession({
        ...session,
        shippingAddress: address,
        billingAddress: address 
      }, orderItems);
      const order = await orderService.getOrder(orderId);
      if (!order) throw new Error('Order creation failed');

      // 3. Create Transaction in Payment Engine
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
        await paymentService.updateTransactionStatus(paymentId, 'Completed', 'simulated_tx');
        await orderService.updatePaymentStatus(order.orderId, 'Paid');
        await checkoutService.updateSession(session.sessionId, { status: 'completed' });
        await cartService.clearCart(session.cartId);
        navigate(\`/order-success/\${orderId}\`);
      }
    } catch (err) {
      console.error('Order placement failed', err);
      setIsProcessing(false);
    }
  };

`;

content = split1[0] + newMethod + methodEndStr + split2[1];

fs.writeFileSync('src/pages/Checkout.tsx', content);
