import re

with open('src/pages/MarketplacePage.tsx', 'r') as f:
    content = f.read()

# Remove BuyerHome import
content = content.replace("import { BuyerHome } from '../components/marketplace/BuyerHome';\n", "")

# We want the page to always show the search results UI and filters, not the !query ? BuyerHome : ...
# Let's find the main section.
old_main = """      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-28 lg:pb-28">
        {!query ? (
          <BuyerHome 
            user={user} 
            onSearchSubmit={(val) => setQuery(val)}
            onNavigate={(view) => navigate(`/${view}`)}
            onCategorySelect={(catId) => {
              if (catId === 'product' || catId === 'service' || catId === 'business' || catId === 'job') {
                setActiveType(catId as any);
                setQuery(catId === 'job' ? 'senior' : 'coffee'); // Seed a query for instant feedback
              } else if (catId === 'more') {
                setActiveType('all');
                setQuery(' ');
              } else {
                setQuery(catId);
              }
            }}
          />
        ) : (
          <>"""

new_main = """      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-28 lg:pb-28">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Marketplace</h1>
        </div>
        <div className="w-full">
          <>"""

content = content.replace(old_main, new_main)

# We also need to remove the closing tags for the condition
old_end = """          </>
        )}
      </main>"""

new_end = """          </>
        </div>
      </main>"""

content = content.replace(old_end, new_end)

with open('src/pages/MarketplacePage.tsx', 'w') as f:
    f.write(content)
