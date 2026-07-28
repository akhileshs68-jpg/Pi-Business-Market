const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

const importRegex = /import { getFirebaseDb } from '\.\.\/firebase\/config';\nimport { doc, setDoc, deleteDoc/g;
code = code.replace(importRegex, "import { getFirebaseDb } from '../firebase/config';\nimport { doc, setDoc, deleteDoc, collection, getDocs, query, where }");

const stateRegex = /const \[updateError, setUpdateError\] = useState<string \| null>\(null\);/g;
code = code.replace(stateRegex, `const [updateError, setUpdateError] = useState<string | null>(null);

  // Live Metrics States
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [revenueTrend, setRevenueTrend] = useState(0); // Optional: calculate trend
`);

const loadDataRegex = /const \[bizData, memberData, docData\] = await Promise\.all\(\[\n\s*businessService\.getBusiness\(id\),\n\s*businessMemberService\.getBusinessMembers\(id\),\n\s*businessVerificationService\.getBusinessDocuments\(id\)\n\s*\]\);/g;
code = code.replace(loadDataRegex, `const db = getFirebaseDb();
        const [bizData, memberData, docData, ordersSnap, productsSnap] = await Promise.all([
          businessService.getBusiness(id),
          businessMemberService.getBusinessMembers(id),
          businessVerificationService.getBusinessDocuments(id),
          getDocs(query(collection(db, 'orders'), where('businessId', '==', id))),
          getDocs(query(collection(db, 'products'), where('businessId', '==', id)))
        ]);

        let rev = 0;
        const uniqueCustomers = new Set<string>();
        ordersSnap.forEach(doc => {
          const o = doc.data();
          if (o.totalAmount) rev += Number(o.totalAmount);
          if (o.userId) uniqueCustomers.add(o.userId);
        });

        setTotalOrders(ordersSnap.size);
        setTotalProducts(productsSnap.size);
        setTotalRevenue(rev);
        setTotalCustomers(uniqueCustomers.size);`);

const kpisRegex = /const kpis = \[\s*{\s*label: 'Revenue', val: '\$142,500\.00', trend: '\+14\.2%', progress: 82, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500\/10', trendColor: 'text-emerald-400' },[\s\S]*?\];/g;
code = code.replace(kpisRegex, `const kpis = [
    { label: 'Revenue', val: \`\${totalRevenue.toFixed(2)} Pi\`, trend: 'Live', progress: totalRevenue > 0 ? 100 : 0, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trendColor: 'text-emerald-400' },
    { label: 'Orders', val: totalOrders.toString(), trend: 'Live', progress: totalOrders > 0 ? 100 : 0, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10', trendColor: 'text-blue-400' },
    { label: 'Products', val: totalProducts.toString(), trend: 'Live', progress: totalProducts > 0 ? 100 : 0, icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10', trendColor: 'text-purple-400' },
    { label: 'Customers', val: totalCustomers.toString(), trend: 'Live', progress: totalCustomers > 0 ? 100 : 0, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', trendColor: 'text-pink-400' },
    { label: 'Stores', val: business.storeCount || 0, trend: 'Live', progress: business.storeCount > 0 ? 100 : 0, icon: Store, color: 'text-amber-400', bg: 'bg-amber-500/10', trendColor: 'text-amber-400' },
    { label: 'Employees', val: members.length, trend: 'Live', progress: members.length > 0 ? 100 : 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trendColor: 'text-indigo-400' },
    { label: 'Followers', val: business.followers || 0, trend: 'Live', progress: (business.followers || 0) > 0 ? 100 : 0, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', trendColor: 'text-sky-400' },
    { label: 'Rating', val: business.rating?.toFixed(1) || 'N/A', trend: 'Live', progress: business.rating ? (business.rating / 5) * 100 : 0, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/10', trendColor: 'text-yellow-400' },
    { label: 'Pending Tasks', val: business.storeCount === 0 || docs.length === 0 ? '2' : '0', trend: 'Urgent', progress: 20, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', trendColor: 'text-rose-400' },
    { label: 'Verification', val: \`\${verificationProgress}%\`, trend: business.verificationStatus === 'Verified' ? 'Complete' : 'Under Review', progress: verificationProgress, icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trendColor: 'text-indigo-400' },
    { label: 'Documents', val: docs.length.toString(), trend: 'Approved', progress: docs.length > 0 ? 100 : 0, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trendColor: 'text-emerald-400' },
  ];`);

const mockChartRegex = /<svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 200">[\s\S]*?<\/svg>/g;
code = code.replace(mockChartRegex, `<svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 200">
                          {/* Live data for chart is pending integration, displaying placeholder axes for now */}
                          <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(30, 41, 59, 1)" strokeWidth="1" />
                          <text x="300" y="100" fill="rgba(148, 163, 184, 0.5)" fontSize="12" textAnchor="middle">No historical revenue data available</text>
                        </svg>`);

const removeTooltipsRegex = /<AnimatePresence>[\s\S]*?<\/AnimatePresence>/g;
code = code.replace(removeTooltipsRegex, '');

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
