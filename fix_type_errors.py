import re

# Fix BmpRewardsWallet.tsx
with open('src/components/BmpRewardsWallet.tsx', 'r') as f:
    content = f.read()

content = content.replace("tx.createdAt?.seconds * 1000 || Date.now()", "tx.createdAt ? new Date(tx.createdAt).getTime() : Date.now()")

with open('src/components/BmpRewardsWallet.tsx', 'w') as f:
    f.write(content)

# Fix Checkout.tsx
with open('src/pages/Checkout.tsx', 'r') as f:
    content = f.read()

content = content.replace("const buyerId = session.userId || session.userUid || 'UNKNOWN';", "const buyerId = (session as any).userId || session.userUid || 'UNKNOWN';")

with open('src/pages/Checkout.tsx', 'w') as f:
    f.write(content)
