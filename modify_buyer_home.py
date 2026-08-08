import re

with open('src/components/marketplace/BuyerHome.tsx', 'r') as f:
    content = f.read()

# Update placeholder in BuyerHome.tsx search bar
placeholder_search = 'placeholder={`Search ${searchCategory === \'all\' ? \'anything across Pi Business Market\' : searchCategory}...`}'
placeholder_replacement = 'placeholder="Search products, services, businesses & stores..."'

if placeholder_search in content:
    content = content.replace(placeholder_search, placeholder_replacement)
    print("Replaced placeholder")
else:
    print("Could not find placeholder")

# Make Search and Filters spacing smaller
content = content.replace(
    '<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-xl backdrop-blur-xl flex flex-col gap-1.5">',
    '<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-md backdrop-blur-xl flex flex-col gap-1.5">'
)

content = content.replace(
    'py-2.5 pl-10 pr-28 text-xs',
    'py-2 pl-9 pr-24 text-[11px] sm:text-xs'
)

with open('src/components/marketplace/BuyerHome.tsx', 'w') as f:
    f.write(content)

print("BuyerHome updated")
