const fs = require('fs');

function makeAllReturnAny(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/async getOrdersBySeller\(sellerId: string, \.\.\.args: any\[\]\)/g, "async getOrdersBySeller(sellerId: string, ...args: any[]): Promise<any>");
  content = content.replace(/async getOrdersByBuyer\(buyerId: string\)/g, "async getOrdersByBuyer(buyerId: string): Promise<any>");
  content = content.replace(/async getProductsBySeller\(sellerId: string, \.\.\.args: any\[\]\)/g, "async getProductsBySeller(sellerId: string, ...args: any[]): Promise<any>");
  content = content.replace(/async getItemsByStore\(storeId: string\)/g, "async getItemsByStore(storeId: string): Promise<any>");
  
  // also getStoreProducts
  content = content.replace(/async getStoreProducts\(storeId: string, \.\.\.args: any\[\]\)/g, "async getStoreProducts(storeId: string, ...args: any[]): Promise<any>");
  
  // also updateItem
  content = content.replace(/async updateItem\(id: string, type: 'product' \| 'service', updateData: any\): Promise<void>/g, "async updateItem(id: string, type: 'product' | 'service', updateData: any, ...args: any[]): Promise<void>");
  content = content.replace(/async deleteItem\(id: string, type: 'product' \| 'service'\): Promise<void>/g, "async deleteItem(id: string, type: 'product' | 'service', ...args: any[]): Promise<void>");
  content = content.replace(/async permanentDeleteProduct\(id: string\)/g, "async permanentDeleteProduct(id: string, ...args: any[])");

  fs.writeFileSync(file, content);
}

makeAllReturnAny('src/services/orderService.ts');
makeAllReturnAny('src/services/productService.ts');
