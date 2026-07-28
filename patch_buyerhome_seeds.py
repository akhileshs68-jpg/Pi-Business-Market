import re

with open("src/components/marketplace/BuyerHome.tsx", "r") as f:
    text = f.read()

# Remove the seedAllIfNeeded call
text = re.sub(r"\s*await seedingService\.seedAllIfNeeded\(\);\n", "\n", text)

with open("src/components/marketplace/BuyerHome.tsx", "w") as f:
    f.write(text)

