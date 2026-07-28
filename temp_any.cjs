const fs = require('fs');

function makeMethodsAny(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/async getOrderById\(id: string\)/g, "async getOrderById(id: string): Promise<any>");
  content = content.replace(/async getOrder\(orderId: string\)/g, "async getOrder(orderId: string): Promise<any>");
  content = content.replace(/async getStoreOrders\(storeId: string, \.\.\.args: any\[\]\)/g, "async getStoreOrders(storeId: string, ...args: any[]): Promise<any>");
  content = content.replace(/async getBusinessOrders\(businessId: string\)/g, "async getBusinessOrders(businessId: string): Promise<any>");
  content = content.replace(/async getCustomerOrders\(customerId: string\)/g, "async getCustomerOrders(customerId: string): Promise<any>");
  
  if (file.includes('productService')) {
    content = content.replace(/async getProductById\(id: string\)/g, "async getProductById(id: string): Promise<any>");
    content = content.replace(/async getProduct\(productId: string\)/g, "async getProduct(productId: string): Promise<any>");
    content = content.replace(/async getStoreProducts\(storeId: string, \.\.\.args: any\[\]\)/g, "async getStoreProducts(storeId: string, ...args: any[]): Promise<any>");
  }

  fs.writeFileSync(file, content);
}

makeMethodsAny('src/services/orderService.ts');
makeMethodsAny('src/services/productService.ts');
