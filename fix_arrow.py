import re

with open('src/pages/MarketplacePage.tsx', 'r') as f:
    content = f.read()

content = content.replace("<ArrowRight,\n  SlidersHorizontal", "<ArrowRight")
content = content.replace("ArrowRight,\n  SlidersHorizontal\n} from", "ArrowRight,\n  SlidersHorizontal\n} from")

with open('src/pages/MarketplacePage.tsx', 'w') as f:
    f.write(content)
