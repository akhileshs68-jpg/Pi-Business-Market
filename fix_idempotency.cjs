const fs = require('fs');
let code = fs.readFileSync('src/services/orderService.ts', 'utf8');

const createFromSessionMatch = /async createFromSession\(session: any, items: any\[\]\) \{[\s\S]*?\}/;
const newCreateFromSession = `async createFromSession(session: any, items: any[]) {
    const db = getFirebaseDb();
    
    // Check if order already exists for this session
    const q = query(collection(db, 'orders'), where('sessionId', '==', session.sessionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      // return the first matching order id
      return snap.docs[0].id;
    }

    const orderData = { 
      session, 
      items, 
      sessionId: session.sessionId,
      orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      businessId: session.storeId || session.businessId || 'UNKNOWN',
      buyerId: session.userId || session.userUid || 'UNKNOWN',
      grandTotal: session.total || 0,
      orderStatus: 'PENDING_PAYMENT'
    };
    return this.createOrder(orderData);
  }`;

code = code.replace(createFromSessionMatch, newCreateFromSession);
fs.writeFileSync('src/services/orderService.ts', code);
