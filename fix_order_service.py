import re

with open('src/services/orderService.ts', 'r') as f:
    content = f.read()

# Make sure arrayUnion is imported
if "arrayUnion" not in content:
    content = content.replace("import { collection,", "import { collection, arrayUnion,")

new_update_func = """  async updateOrderStatus(id: string, status: string, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(itemRef);

    let updates: any = {
      orderStatus: status,
      currentStatus: status.toLowerCase(),
      updatedAt: serverTimestamp(),
    };

    if (orderSnap.exists()) {
      const order = orderSnap.data();

      // If cancelling, restore stock
      if (status === 'Cancelled' && order.orderStatus !== 'Cancelled' && order.items) {
        for (const item of order.items) {
          if (item.productId) {
            const productRef = doc(db, 'products', item.productId);
            const pSnap = await getDoc(productRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              const newStock = (pData.stock || 0) + (item.quantity || 1);
              await updateDoc(productRef, { stock: newStock });
            }
          }
        }
      }

      // Handle timeline timestamps
      if (status === 'Accepted' || status === 'Processing') updates.acceptedAt = serverTimestamp();
      if (status === 'Packed' || status === 'Ready for Pickup') updates.packedAt = serverTimestamp();
      if (status === 'Shipped') updates.shippedAt = serverTimestamp();
      if (status === 'Delivered' || status === 'Completed') updates.deliveredAt = serverTimestamp();

      // Log activity
      let logMessage = `Order status updated to ${status}`;
      if (status === 'Accepted') logMessage = 'Seller Accepted';
      if (status === 'Packed') logMessage = 'Packed';
      if (status === 'Shipped') logMessage = 'Shipped';
      if (status === 'Delivered') logMessage = 'Delivered';

      updates.activityLogs = arrayUnion({
        timestamp: new Date().toISOString(),
        message: logMessage
      });
      
      await updateDoc(itemRef, updates);

      try {
        await notificationService.notify(
          order.buyerId,
          'order_update',
          'Order Status Updated',
          `Your order ${order.orderNumber || ''} is now ${status}.`,
          { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
        );
      } catch (e) {
        console.warn("Failed to notify buyer of status change", e);
      }
    } else {
      await updateDoc(itemRef, updates);
    }
  },"""

content = re.sub(r'  async updateOrderStatus.*?\}\s*\}\s*\},', new_update_func, content, flags=re.DOTALL)

with open('src/services/orderService.ts', 'w') as f:
    f.write(content)
