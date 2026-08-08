import re

with open('src/components/marketplace/BuyerHome.tsx', 'r') as f:
    buyer_home_content = f.read()

# 1. Extract Smart Search Bar
search_bar_start = buyer_home_content.find('{/* 3. SMART SEARCH BAR */}')
search_bar_end = buyer_home_content.find('</section>', search_bar_start) + len('</section>')

smart_search_block = buyer_home_content[search_bar_start:search_bar_end]

# 2. Extract Quick Actions Bar
quick_actions_start = buyer_home_content.find('{/* 2. QUICK ACTIONS BAR */}')
quick_actions_end = buyer_home_content.find('</section>', quick_actions_start) + len('</section>')

# 3. Create Primary Buttons block
primary_buttons = """
      {/* 2. PRIMARY ACTIONS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 z-20 relative">
        <motion.button 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('marketplace')}
          className="bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/60 p-6 rounded-3xl flex items-center justify-between transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/30 text-indigo-400 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Buy Products</h3>
              <p className="text-[11px] text-indigo-300/80 font-bold tracking-widest uppercase mt-0.5">Explore Marketplace</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategorySelect('Services')}
          className="bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500/60 p-6 rounded-3xl flex items-center justify-between transition-all group text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600/30 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">Find Services</h3>
              <p className="text-[11px] text-emerald-300/80 font-bold tracking-widest uppercase mt-0.5">Hire Experts</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      </section>
"""

# 4. Remove Quick Actions Bar and Smart Search Bar from their old locations
new_buyer_home = buyer_home_content[:quick_actions_start] + buyer_home_content[search_bar_end:]

# 5. Insert Smart Search Bar and Primary Buttons at the top, right before Hero Slider
hero_slider_marker = '{/* 1. HERO ADVERTISEMENT SLIDER (ENTERPRISE AD ENGINE) */}'
hero_idx = new_buyer_home.find(hero_slider_marker)

insertion = smart_search_block + "\n" + primary_buttons + "\n      "

new_buyer_home = new_buyer_home[:hero_idx] + insertion + new_buyer_home[hero_idx:]

with open('src/components/marketplace/BuyerHome.tsx', 'w') as f:
    f.write(new_buyer_home)

# Now modify HomeCommandCenter.tsx to return null
with open('src/components/home/HomeCommandCenter.tsx', 'r') as f:
    home_cmd_content = f.read()

# We will just replace the return statement with return null;
return_idx = home_cmd_content.find('  return (')
new_home_cmd = home_cmd_content[:return_idx] + '  return null;\n};\n'

with open('src/components/home/HomeCommandCenter.tsx', 'w') as f:
    f.write(new_home_cmd)

print("Modification complete.")
