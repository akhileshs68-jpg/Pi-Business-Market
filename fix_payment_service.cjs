const fs = require('fs');
let code = fs.readFileSync('src/services/paymentService.ts', 'utf8');

const updateRegex = /async updateTransactionStatus[\s\S]*?(?=async getBusinessPayments)/;
const newUpdate = `async updateTransactionStatus(paymentId: string, status: PaymentStatusType, txid?: string): Promise<void> {
    try {
      await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: paymentId, status, txid })
      });
    } catch(err) {
      console.error('Failed to update status', err);
    }
  },
  `;

code = code.replace(updateRegex, newUpdate);

// Also remove `await this.updateTransactionStatus` calls inside processPiPayment where they conflict with server.ts
// Actually, server.ts is doing the update for approve and complete, so we shouldn't do it on client.
const approveClientUpdate = /await this\.updateTransactionStatus\(paymentId, 'Processing'\);/g;
code = code.replace(approveClientUpdate, "// Server handles Processing state");

const completeClientUpdate = /await this\.updateTransactionStatus\(paymentId, 'Completed', txid\);/g;
code = code.replace(completeClientUpdate, "// Server handles Completed state");

const orderClientUpdate = /await orderService\.updatePaymentStatus\(metadata\.orderId, 'Paid'\);/g;
code = code.replace(orderClientUpdate, "// Server handles order Paid state");

fs.writeFileSync('src/services/paymentService.ts', code);
