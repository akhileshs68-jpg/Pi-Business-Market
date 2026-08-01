import re

with open('src/services/productService.ts', 'r') as f:
    content = f.read()

# Replace getItemsByOwner definition
content = re.sub(
    r'async getItemsByOwner\(ownerUid: string, roleId: string, type: \'product\' \| \'service\'\) \{',
    r'async getItemsByOwner(ownerUid: string, type: \'product\' | \'service\') {',
    content
)

# Replace the query in getItemsByOwner to not use roleId
old_query = '''    let q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid),
      where('roleId', '==', roleId)
    );'''

new_query = '''    let q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid)
    );'''

content = content.replace(old_query, new_query)

with open('src/services/productService.ts', 'w') as f:
    f.write(content)
