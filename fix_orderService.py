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
        sanitizedData[key] = val;
      }
    });

    await setDoc(itemRef, {
      ...sanitizedData,
      id,
      type: 'order',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });"""

# Use regex to replace the function definition up to await setDoc
content = re.sub(r'async createOrder\(orderData: any\): Promise<string> \{.*?await setDoc\(itemRef, \{\n\s*\.\.\.orderData,\n\s*id,\n\s*type: \'order\',\n\s*createdAt: serverTimestamp\(\),\n\s*updatedAt: serverTimestamp\(\),\n\s*\}\);', replacement, content, flags=re.DOTALL)

with open('src/services/orderService.ts', 'w') as f:
    f.write(content)
print("Replaced successfully")
