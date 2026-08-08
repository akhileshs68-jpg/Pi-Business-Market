import re

with open('src/components/marketplace/BuyerHome.tsx', 'r') as f:
    content = f.read()

# Extract 2. PRIMARY ACTIONS
start_1 = content.find('{/* 2. PRIMARY ACTIONS */}')
end_1 = content.find('</section>', start_1) + len('</section>')
primary_actions = content[start_1:end_1]

# Extract 2.5 SECONDARY SELLER ACTIONS
start_2 = content.find('{/* 2.5 SECONDARY SELLER ACTIONS */}')
end_2 = content.find('</section>', start_2) + len('</section>')
secondary_actions = content[start_2:end_2]

# Remove both from their current positions
# Do it carefully.
content = content.replace(primary_actions, '')
content = content.replace(secondary_actions, '')

# We need to create a unified section for the 4 actions.
unified_actions = """
      {/* 2. FOUR COMPACT ACTIONS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 z-20 relative">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('marketplace')}
          className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 hover:border-indigo-500/40 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-wide leading-tight truncate">Buy Products</h3>
            <p className="text-[9px] text-indigo-300/70 font-bold tracking-widest uppercase mt-0.5 truncate">Explore Market</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategorySelect('Services')}
          className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 hover:border-emerald-500/40 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-wide leading-tight truncate">Find Services</h3>
            <p className="text-[9px] text-emerald-300/70 font-bold tracking-widest uppercase mt-0.5 truncate">Hire Experts</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wide leading-tight truncate">Sell Products</h3>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 truncate">Open a Store</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wide leading-tight truncate">Offer Service</h3>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 truncate">Offer Expertise</p>
          </div>
        </motion.button>
      </section>
"""

# Now find where to insert it.
# It should go AFTER the HERO ADVERTISEMENT SLIDER section, and BEFORE 3. PRODUCT CATEGORIES GRID
hero_end_marker = '</section>\n      )}'
categories_start_marker = '{/* 3. PRODUCT CATEGORIES GRID */}'

idx_hero = content.find(categories_start_marker)

if idx_hero != -1:
    content = content[:idx_hero] + unified_actions + '\n\n      ' + content[idx_hero:]
else:
    print("Could not find Categories Grid")

with open('src/components/marketplace/BuyerHome.tsx', 'w') as f:
    f.write(content)

print("BuyerHome structure fixed.")
