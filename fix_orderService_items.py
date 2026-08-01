import re

with open('src/services/orderService.ts', 'r') as f:
    content = f.read()

replacement = """  async createOrder(orderData: any): Promise<string> {
    const db = getFirebaseDb();
    const itemRef = doc(collection(db, 'orders'));
    const id = itemRef.id;
    
    // Sanitize orderData
    const sanitizedData: any = {};
    Object.entries(orderData).forEach(([key, val]) => {
      if (val !== undefined && !Number.isNaN(val)) {
        if (key === 'items' && Array.isArray(val)) {
          sanitizedData[key] = val.map(item => {
            const cleanItem: any = {};
            Object.entries(item).forEach(([k, v]) => {
               if (v !== undefined && !Number.isNaN(v)) cleanItem[k] = v;
            });
            return cleanItem;
          });
        } else {
          sanitizedData[key] = val;
        }
      }
    });

    await setDoc(itemRef, {
      ...sanitizedData,
      id,
      type: 'order',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });"""

# Because the first python script already replaced it once, we match the NEW signature
content = re.sub(r'async createOrder\(orderData: any\): Promise<string> \{.*?await setDoc\(itemRef, \{\n\s*\.\.\.sanitizedData,\n\s*id,\n\s*type: \'order\',\n\s*createdAt: serverTimestamp\(\),\n\s*updatedAt: serverTimestamp\(\),\n\s*\}\);', replacement, content, flags=re.DOTALL)

with open('src/services/orderService.ts', 'w') as f:
    f.write(content)
print("Replaced successfully")
