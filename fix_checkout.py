import re

with open('src/pages/Checkout.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { piPaymentService } from '../services/piPaymentService';", "import { paymentEngine } from '../services/wallet/paymentEngine';")
content = content.replace("const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('pi');", "const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('bmp_rewards');")
content = content.replace("if (selectedPaymentMethod !== 'pi') {\n        throw new Error('Only Pi payment is currently supported.');\n      }", "if (selectedPaymentMethod !== 'bmp_rewards') {\n        throw new Error('Only BMP Rewards payment is currently supported.');\n      }")

old_payment_logic = """
      // 3. Create Transaction in Payment Engine
      const paymentId = await paymentService.createTransaction({
        userId: session.userId || session.userUid || 'UNKNOWN',
        sellerId: session.storeId || session.businessId || 'UNKNOWN',
        businessId: session.storeId || session.businessId || 'UNKNOWN',
        storeId: session.storeId || session.businessId || 'UNKNOWN',
        orderId: session.sessionId,
        productIds: orderItems.map(i => i.productId),
        currency: 'PI_TEST',
        paymentMethod: 'pi',
        amount: grandTotal
      });

      // 4. Launch Pi SDK Payment (U2A Payment Flow)
      await paymentService.processPiPayment(
        paymentId,
        grandTotal,
        `Order at Pi Business Market`,
        {
          productType: 'MarketplaceOrder',
          orderId: session.sessionId,
          storeId: businessId,
          itemsCount: orderItems.length,
          transactionId: paymentId
        },
        async (txid) => {
          try {
            // 1. Verify the payment on the server
            await paymentService.updateTransactionStatus(paymentId, 'Completed', txid);
            await paymentService.recordPaymentHistory(paymentId);
            
            // 2. Save the order in Firestore / 3. Update paymentStatus / 4. Update orderStatus
            const orderId = await orderService.createFromSession({
              ...session,
              shippingAddress: address,
              billingAddress: address,
              paymentStatus: 'SUCCESS',
              orderStatus: 'CONFIRMED',
              paymentId: paymentId,
              transactionId: txid,
              amount: grandTotal,
              currency: 'PI_TEST',
              timestamp: Date.now()
            }, orderItems);

            const order = await orderService.getOrder(orderId);
            if (!order) throw new Error('Order creation failed');
            
            // 5. Clear the shopping cart
            if (session.cartIds && session.cartIds.length > 0) {
              await Promise.all(session.cartIds.map(async cid => {
                 await cartService.clearCart(cid);
              }));
            }

            setCompletedOrder(order);
            setPaymentTxId(txid);
            setPaymentState('success');
            setIsProcessing(false);
            
            const event = new CustomEvent('toast', { detail: { message: 'Payment Successful! Your order has been placed.', type: 'success' } });
            window.dispatchEvent(event);
            
            // Auto redirect after a few seconds
            setTimeout(() => {
              navigate(`/order-details/${orderId}`);
            }, 5000);
          } catch (err) {
            setRecoveryError(err instanceof Error ? err.message : 'Payment processing failed after success.');
            setPaymentState('recovery');
            setIsProcessing(false);
          }
        },
        (err) => {
          // Error callback
          console.error('[Checkout] Payment failed:', err);
          setRecoveryError(typeof err === 'string' ? err : 'Payment failed');
          setPaymentState('recovery');
          setIsProcessing(false);
        }
      );
"""

new_payment_logic = """
      // 3. Process Wallet Payment
      const buyerId = session.userId || session.userUid || 'UNKNOWN';
      const sellerId = session.storeId || session.businessId || 'UNKNOWN';
      
      const { txid } = await paymentEngine.processMarketplacePayment(
        selectedPaymentMethod,
        buyerId,
        sellerId,
        grandTotal,
        session.sessionId
      );

      // 4. Create Transaction Record
      const paymentId = await paymentService.createTransaction({
        userId: buyerId,
        sellerId: sellerId,
        businessId: sellerId,
        storeId: sellerId,
        orderId: session.sessionId,
        productIds: orderItems.map(i => i.productId),
        currency: 'BMP',
        paymentMethod: selectedPaymentMethod,
        amount: grandTotal
      });

      await paymentService.updateTransactionStatus(paymentId, 'Completed', txid);
      await paymentService.recordPaymentHistory(paymentId);
      
      // 5. Save the order in Firestore
      const orderId = await orderService.createFromSession({
        ...session,
        shippingAddress: address,
        billingAddress: address,
        paymentStatus: 'SUCCESS',
        orderStatus: 'CONFIRMED',
        paymentId: paymentId,
        transactionId: txid,
        amount: grandTotal,
        currency: 'BMP',
        timestamp: Date.now()
      }, orderItems);

      const order = await orderService.getOrder(orderId);
      if (!order) throw new Error('Order creation failed');
      
      // 6. Clear the shopping cart
      if (session.cartIds && session.cartIds.length > 0) {
        await Promise.all(session.cartIds.map(async cid => {
            await cartService.clearCart(cid);
        }));
      }

      setCompletedOrder(order);
      setPaymentTxId(txid);
      setPaymentState('success');
      setIsProcessing(false);
      
      const event = new CustomEvent('toast', { detail: { message: 'Payment Successful! Your order has been placed.', type: 'success' } });
      window.dispatchEvent(event);
      
      setTimeout(() => {
        navigate(`/order-details/${orderId}`);
      }, 5000);
"""
# Use a simple split and join or re.sub if needed, since literal replace might have slight whitespace differences,
# I'll use regex.
content = re.sub(r'// 3\. Create Transaction in Payment Engine.*?// Error callback.*?setIsProcessing\(false\);\n\s*\}\n\s*\);', new_payment_logic, content, flags=re.DOTALL)

content = content.replace("{selectedPaymentMethod === 'pi' ? <p className=\"text-sm font-bold text-white\">Pi Network Wallet</p> : <p className=\"text-sm font-bold text-white text-transform-capitalize\">{selectedPaymentMethod}</p>}", "{selectedPaymentMethod === 'bmp_rewards' ? <p className=\"text-sm font-bold text-white\">BMP Rewards Wallet</p> : <p className=\"text-sm font-bold text-white text-transform-capitalize\">{selectedPaymentMethod}</p>}")
content = content.replace("{session.shipping} Pi", "{session.shipping} BMP")
content = content.replace("Pi</span>", "BMP</span>")

with open('src/pages/Checkout.tsx', 'w') as f:
    f.write(content)

