const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const incompleteRegex = /app\.post\("\/api\/payments\/incomplete"[\s\S]*?(?=app\.post\("\/api\/upload"\))/;
const newStatusEndpoint = `app.post("/api/payments/status", async (req, res) => {
    try {
      const { transactionId, status } = req.body;
      if (!transactionId || !status) {
        return res.status(400).json({ error: "transactionId and status are required" });
      }

      if (admin.apps.length > 0) {
        const paymentRef = admin.firestore().collection('payments').doc(transactionId);
        
        // Only allow changing from Pending/Processing to Cancelled/Failed
        await admin.firestore().runTransaction(async (t) => {
          const doc = await t.get(paymentRef);
          if (!doc.exists) throw new Error("Transaction not found");
          
          const currentStatus = doc.data().status;
          if (currentStatus === 'Completed' || currentStatus === 'Refunded') {
            throw new Error("Cannot change status of a completed payment");
          }
          
          t.update(paymentRef, {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Payment Status] Error updating status:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  `;

code = code.replace(incompleteRegex, code.match(incompleteRegex)[0] + "\n  " + newStatusEndpoint);
fs.writeFileSync('server.ts', code);
