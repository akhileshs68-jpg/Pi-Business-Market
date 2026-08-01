import re

with open('src/pages/ProductServiceManager.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useActiveRole } from '../hooks/useActiveRole';", "")
content = content.replace("const activeRole = useActiveRole();", "")
# It used getConfigForRole(activeRole). I will just hardcode config for now, assuming type is 'product'.
# Wait, ProductServiceManager allowed switching? Let's check.
content = content.replace("const config = getConfigForRole(activeRole);", "const config = { type: 'product' as const, title: 'Products', noun: 'Product' };")

content = content.replace("productService.getItemsByOwner(user.uid, activeRole, config.type)", "productService.getItemsByOwner(user.uid, config.type)")

content = content.replace("[user, activeRole, config.type]", "[user, config.type]")

with open('src/pages/ProductServiceManager.tsx', 'w') as f:
    f.write(content)
