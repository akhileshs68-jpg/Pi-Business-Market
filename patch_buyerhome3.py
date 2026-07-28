import re

with open("src/components/marketplace/BuyerHome.tsx", "r") as f:
    text = f.read()

# Update the className in renderProductCard to use rem for exact match with gap-3
text = text.replace("w-[calc(50%-6px)] sm:w-[200px] shrink-0 snap-start", "w-[calc(50%-0.375rem)] sm:w-[200px] shrink-0 snap-start")

with open("src/components/marketplace/BuyerHome.tsx", "w") as f:
    f.write(text)

