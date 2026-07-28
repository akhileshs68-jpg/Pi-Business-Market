const fs = require('fs');

function fixArgs(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/async updateOrderStatus\(id: string, status: string\)/g, "async updateOrderStatus(id: string, status: string, ...args: any[])");
  content = content.replace(/async updatePaymentStatus\(orderId: string, status: string, method\?: string\)/g, "async updatePaymentStatus(orderId: string, status: string, method?: string, ...args: any[])");
  content = content.replace(/async updateFulfillmentStatus\(orderId: string, status: string, data\?: any, note\?: string\)/g, "async updateFulfillmentStatus(orderId: string, status: string, data?: any, note?: string, ...args: any[])");
  content = content.replace(/async getOrdersBySeller\(sellerId: string\)/g, "async getOrdersBySeller(sellerId: string, ...args: any[])");
  
  // For productService.ts
  if (file.includes('productService')) {
    content = content.replace(/async getProductsBySeller\(sellerId: string\)/g, "async getProductsBySeller(sellerId: string, ...args: any[])");
    content = content.replace(/async getStoreProducts\(storeId: string\)/g, "async getStoreProducts(storeId: string, ...args: any[])");
  }

  fs.writeFileSync(file, content);
}

fixArgs('src/services/orderService.ts');
fixArgs('src/services/productService.ts');
