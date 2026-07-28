import re

with open("src/components/marketplace/BuyerHome.tsx", "r") as f:
    text = f.read()

# Make sure we import query and limit
if "query," not in text and "query " not in text:
    text = text.replace("import { collection, getDocs }", "import { collection, getDocs, query, limit }")

text = re.sub(r"getDocs\(collection\((db,\s*'products')\)\)", r"getDocs(query(collection(\1), limit(30)))", text)
text = re.sub(r"getDocs\(collection\((db,\s*'services')\)\)", r"getDocs(query(collection(\1), limit(15)))", text)

with open("src/components/marketplace/BuyerHome.tsx", "w") as f:
    f.write(text)

