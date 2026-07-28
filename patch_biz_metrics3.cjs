const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

const stateRegex = /const \[totalCustomers, setTotalCustomers\] = useState\(0\);/g;
code = code.replace(stateRegex, `const [totalCustomers, setTotalCustomers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);`);

const loadDataRegex = /setTotalCustomers\(uniqueCustomers\.size\);/g;
code = code.replace(loadDataRegex, `setTotalCustomers(uniqueCustomers.size);
        const latestOrds = [];
        ordersSnap.forEach(doc => latestOrds.push({ id: doc.id, ...doc.data() }));
        latestOrds.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setRecentOrders(latestOrds.slice(0, 5));`);

const tableRegex = /<tbody className="divide-y divide-slate-800\/60">[\s\S]*?<\/tbody>/;
code = code.replace(tableRegex, `<tbody className="divide-y divide-slate-800/60">
                            {recentOrders.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                                  No recent orders found.
                                </td>
                              </tr>
                            ) : (
                              recentOrders.map(order => (
                                <tr key={order.id} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                                  <td className="py-4 font-bold text-white">{order.storeName || 'Online Store'}</td>
                                  <td className="py-4 font-mono text-xs">{order.id}</td>
                                  <td className="py-4">Order</td>
                                  <td className="py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400">{order.orderStatus || 'Pending'}</span>
                                  </td>
                                  <td className="py-4 text-right font-extrabold text-white">{order.totalAmount || 0} Pi</td>
                                </tr>
                              ))
                            )}
                          </tbody>`);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
