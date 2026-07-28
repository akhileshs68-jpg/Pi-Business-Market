import { getFirebaseDb } from './src/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function fetchMetrics() {
  const db = getFirebaseDb();
  const bSnap = await getDocs(collection(db, 'businesses'));
  let bizId = '';
  bSnap.forEach(doc => {
    if (!bizId) bizId = doc.id;
  });

  if (!bizId) return { error: "No business found" };

  const [bizData, memberData, docData, ordersSnap, productsSnap] = await Promise.all([
    getDocs(query(collection(db, 'businesses'), where('id', '==', bizId))),
    getDocs(query(collection(db, 'businessMembers'), where('businessId', '==', bizId))),
    getDocs(query(collection(db, 'businessDocuments'), where('businessId', '==', bizId))),
    getDocs(query(collection(db, 'orders'), where('businessId', '==', bizId))),
    getDocs(query(collection(db, 'products'), where('businessId', '==', bizId)))
  ]);

  const biz = bSnap.docs.find(d => d.id === bizId)?.data() || {};
  
  let rev = 0;
  const uniqueCustomers = new Set<string>();
  ordersSnap.forEach(doc => {
    const o = doc.data();
    if (o.totalAmount) rev += Number(o.totalAmount);
    if (o.userId) uniqueCustomers.add(o.userId);
  });

  return {
    businessId: bizId,
    Revenue: rev,
    Orders: ordersSnap.size,
    Products: productsSnap.size,
    Customers: uniqueCustomers.size,
    Stores: biz.storeCount || 0,
    Employees: memberData.size,
    Followers: biz.followers || 0,
    Rating: biz.rating,
    RecentOrders: ordersSnap.size
  };
}
