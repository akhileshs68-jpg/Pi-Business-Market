import re

with open("src/services/searchService.ts", "r") as f:
    text = f.read()

text = re.sub(r"getDocs\(collection\((db,\s*'products')\)\)", r"getDocs(query(collection(\1), limit(100)))", text)
text = re.sub(r"getDocs\(collection\((db,\s*'businesses')\)\)", r"getDocs(query(collection(\1), limit(50)))", text)
text = re.sub(r"getDocs\(collection\((db,\s*'stores')\)\)", r"getDocs(query(collection(\1), limit(50)))", text)
text = re.sub(r"getDocs\(collection\((db,\s*'services')\)\)", r"getDocs(query(collection(\1), limit(100)))", text)
text = re.sub(r"getDocs\(collection\((db,\s*'jobs')\)\)", r"getDocs(query(collection(\1), limit(50)))", text)

with open("src/services/searchService.ts", "w") as f:
    f.write(text)

