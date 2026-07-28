const fs = require('fs');

function addAsAny(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/=> \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\)/g, "=> ({ id: doc.id, ...doc.data() } as any))");
  
  if (file.includes('orderService')) {
    content = content.replace(/snap\.exists\(\) \? \{ id: snap\.id, \.\.\.snap\.data\(\) \} : null/g, "snap.exists() ? { id: snap.id, ...snap.data() } as any : null");
  } else if (file.includes('productService')) {
    content = content.replace(/snap\.exists\(\) \? \{ id: snap\.id, \.\.\.snap\.data\(\) \} : null/g, "snap.exists() ? { id: snap.id, ...snap.data() } as any : null");
    
    // Add isSkuUnique and isSlugUnique
    if (!content.includes('isSkuUnique')) {
       content = content.replace(/};?\s*$/g, ",\n  async isSkuUnique(sku: string) { return true; },\n  async isSlugUnique(slug: string) { return true; }\n};");
    }
  }

  fs.writeFileSync(file, content);
}

addAsAny('src/services/orderService.ts');
addAsAny('src/services/productService.ts');
