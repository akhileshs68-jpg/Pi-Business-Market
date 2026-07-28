import re

with open("src/components/marketplace/BuyerHome.tsx", "r") as f:
    text = f.read()

# Update the className in renderProductCard to include sm:w-[200px]
text = text.replace("w-[calc(50%-6px)] shrink-0 snap-start", "w-[calc(50%-6px)] sm:w-[200px] shrink-0 snap-start")

with open("src/components/marketplace/BuyerHome.tsx", "w") as f:
    f.write(text)

