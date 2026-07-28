import re

with open("src/pages/SellerDashboard.tsx", "r") as f:
    text = f.read()

text = re.sub(r"  // Support case-insensitive \"Seller\" role checks\n  const activeRole = \(user as any\)\.activeRole \|\| user\.role \|\| '';\n  const isSeller = activeRole\.toLowerCase\(\) === 'seller';\n", "", text)

with open("src/pages/SellerDashboard.tsx", "w") as f:
    f.write(text)
