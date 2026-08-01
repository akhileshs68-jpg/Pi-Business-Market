import fs from 'fs';
let content = fs.readFileSync('src/services/paymentService.ts', 'utf8');

content = content.replace(
  /async getCustomerPayments\(customerId: string\): Promise<any\[\]> \{\n    return \[\];\n  \},/,
  `async getCustomerPayments(customerId: string): Promise<any[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'payments'), where('userId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },`
);

content = content.replace(
  /async getBusinessPayments\(businessId: string\): Promise<any\[\]> \{\n    return \[\];\n  \},/,
  `async getBusinessPayments(businessId: string): Promise<any[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'payments'), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },`
);

fs.writeFileSync('src/services/paymentService.ts', content);
