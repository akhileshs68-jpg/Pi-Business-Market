const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace /api/payments/approve
const approveRegex = /app\.post\("\/api\/payments\/approve"[\s\S]*?(?=app\.post\("\/api\/payments\/complete")/;
const newApprove = `app.post("/api/payments/approve", async (req, res) => {
    try {
      const { paymentId, metadata } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      const apiKey = process.env.PI_NETWORK_API_KEY;
      if (!apiKey) {
        console.warn("[Pi Payment Approve] PI_NETWORK_API_KEY is not configured in env. Simulating sandbox approval.");
        
        // Update firestore transaction to Processing in Sandbox Mode
        if (metadata?.transactionId && admin.apps.length > 0) {
          try {
            await admin.firestore().collection('payments').doc(metadata.transactionId).update({
              status: 'Processing',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch(err) {
            console.error("Failed to update firestore", err);
          }
        }

        return res.json({
          success: true,
          message: "Payment approved in sandbox mode",
          paymentId,
        });
      }

      console.log(\`[Pi Payment Approve] Requesting Pi server approval for payment \${paymentId}...\`);
      const response = await axios.post(
        \`https://api.minepi.com/v2/payments/\${paymentId}/approve\`,
        {},
        { headers: { Authorization: \`Key \${apiKey}\` } }
      );
      
      // Update firestore transaction to Processing
      if (metadata?.transactionId && admin.apps.length > 0) {
        try {
          await admin.firestore().collection('payments').doc(metadata.transactionId).update({
            status: 'Processing',
            piPaymentId: paymentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch(err) {
          console.error("Failed to update firestore", err);
        }
      }

      console.log(\`[Pi Payment Approve] Successfully approved payment \${paymentId}\`);
      res.json({ success: true, payment: response.data });
    } catch (error: any) {
      console.error("[Pi Payment Approve] Error approving payment:", error.response?.data || error.message);
      res.status(500).json({
        error: "Failed to approve payment with Pi Network server",
        details: error.response?.data || error.message,
      });
    }
  });

  `;

code = code.replace(approveRegex, newApprove);

// Replace /api/payments/complete
const completeRegex = /app\.post\("\/api\/payments\/complete"[\s\S]*?(?=app\.post\("\/api\/payments\/incomplete")/;
const newComplete = `app.post("/api/payments/complete", async (req, res) => {
    try {
      const { paymentId, txid, metadata } = req.body;
      if (!paymentId || !txid) {
        return res.status(400).json({ error: "paymentId and txid are required" });
      }

      // 1. Verify idempotency using Firestore
      if (metadata?.transactionId && admin.apps.length > 0) {
        const paymentRef = admin.firestore().collection('payments').doc(metadata.transactionId);
        
        try {
          const result = await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(paymentRef);
            if (!doc.exists) {
              throw new Error("Transaction not found");
            }
            if (doc.data().status === 'Completed') {
              throw new Error("Payment already completed");
            }
            
            // Mark as completed
            t.update(paymentRef, {
              status: 'Completed',
              transactionId: txid,
              piPaymentId: paymentId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update order status if provided
            if (metadata.orderId) {
              const orderRef = admin.firestore().collection('orders').doc(metadata.orderId);
              t.update(orderRef, {
                paymentStatus: 'Paid',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            
            return true;
          });
        } catch(err: any) {
          if (err.message === "Payment already completed") {
            return res.json({ success: true, message: "Payment already processed", paymentId, txid });
          }
          console.error("Transaction update failed", err);
        }
      }

      const apiKey = process.env.PI_NETWORK_API_KEY;
      if (!apiKey) {
        console.warn("[Pi Payment Complete] PI_NETWORK_API_KEY is not configured in env. Simulating sandbox completion.");
        return res.json({
          success: true,
          message: "Payment completed in sandbox mode",
          paymentId,
          txid,
        });
      }

      console.log(\`[Pi Payment Complete] Requesting Pi server completion for payment \${paymentId} with txid \${txid}...\`);
      const response = await axios.post(
        \`https://api.minepi.com/v2/payments/\${paymentId}/complete\`,
        { txid },
        { headers: { Authorization: \`Key \${apiKey}\` } }
      );
      
      console.log(\`[Pi Payment Complete] Successfully completed payment \${paymentId}\`);
      res.json({ success: true, payment: response.data });
    } catch (error: any) {
      console.error("[Pi Payment Complete] Error completing payment:", error.response?.data || error.message);
      
      // Rollback to failed
      if (req.body.metadata?.transactionId && admin.apps.length > 0) {
        await admin.firestore().collection('payments').doc(req.body.metadata.transactionId).update({
          status: 'Failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
      }

      res.status(500).json({
        error: "Failed to complete payment with Pi Network server",
        details: error.response?.data || error.message,
      });
    }
  });

  `;

code = code.replace(completeRegex, newComplete);
fs.writeFileSync('server.ts', code);
