const fs = require('fs');
let content = fs.readFileSync('src/pages/BusinessOrderDashboard.tsx', 'utf8');

const targetMethod = `  const handleQuickAdvanceStatus = async (e: React.MouseEvent, order: Order, nextStatus: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await orderService.updateOrderStatus(order.orderId, nextStatus, user.uid, 'seller', \`Advanced status to \${nextStatus}\`);
      fetchOrders();
    } catch (err) {
      console.error('Failed status advance', err);
    }
  };`;

const safeMethod = `  const [processingStatusId, setProcessingStatusId] = useState<string | null>(null);

  const handleQuickAdvanceStatus = async (e: React.MouseEvent, order: Order, nextStatus: string) => {
    e.stopPropagation();
    if (!user || processingStatusId === order.orderId) return;
    try {
      setProcessingStatusId(order.orderId);
      await orderService.updateOrderStatus(order.orderId, nextStatus, user.uid, 'seller', \`Advanced status to \${nextStatus}\`);
      fetchOrders();
    } catch (err) {
      console.error('Failed status advance', err);
    } finally {
      setProcessingStatusId(null);
    }
  };`;

if (content.includes(targetMethod)) {
    content = content.replace(targetMethod, safeMethod);
    fs.writeFileSync('src/pages/BusinessOrderDashboard.tsx', content);
    console.log('Successfully patched BusinessOrderDashboard.tsx loading state');
} else {
    console.error('Target method not found');
}
