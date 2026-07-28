const fs = require('fs');
let code = fs.readFileSync('src/services/paymentService.ts', 'utf8');

const createTxRegex = /async createTransaction[\s\S]*?const paymentId =/;
const newCreateTx = `async createTransaction(data: {
    buyerId: string;
    businessId: string;
    orderId?: string;
    bookingId?: string;
    currency: string;
    paymentMethod: PaymentMethodId;
    amount: number;
  }): Promise<string> {
    const db = getFirebaseDb();
    
    if (data.orderId) {
      const q = query(collection(db, 'payments'), where('orderId', '==', data.orderId), where('status', '==', 'Pending'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
    }
    
    const paymentId =`;

code = code.replace(createTxRegex, newCreateTx);
fs.writeFileSync('src/services/paymentService.ts', code);
