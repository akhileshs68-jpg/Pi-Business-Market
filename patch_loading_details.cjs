const fs = require('fs');
let content = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const targetMethod = `  const handleUpdateStatus = async (status: string, remarks?: string) => {
    if (!order || !user) return;
    try {
      const role = isMerchant ? 'seller' : 'buyer';
      await orderService.updateOrderStatus(order.orderId, status, user.uid, role, remarks);
      fetchOrderData();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };`;

const safeMethod = `  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleUpdateStatus = async (status: string, remarks?: string) => {
    if (!order || !user || statusUpdating) return;
    try {
      setStatusUpdating(true);
      const role = isMerchant ? 'seller' : 'buyer';
      await orderService.updateOrderStatus(order.orderId, status, user.uid, role, remarks);
      fetchOrderData();
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setStatusUpdating(false);
    }
  };`;

if (content.includes(targetMethod)) {
    content = content.replace(targetMethod, safeMethod);
    fs.writeFileSync('src/pages/OrderDetails.tsx', content);
    console.log('Successfully patched OrderDetails.tsx loading state');
} else {
    console.error('Target method not found');
}
