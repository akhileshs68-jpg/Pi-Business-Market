import re
with open("src/components/marketplace/BuyerHome.tsx", "r") as f:
    text = f.read()

text = re.sub(r"// Sponsored Ads Database.*?\];\n", "", text, flags=re.DOTALL)

with open("src/components/marketplace/BuyerHome.tsx", "w") as f:
    f.write(text)
