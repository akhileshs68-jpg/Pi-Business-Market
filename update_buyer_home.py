import re

with open('src/components/marketplace/BuyerHome.tsx', 'r') as f:
    content = f.read()

# 1. Reduce overall vertical spacing
content = content.replace(
    '<div className="pb-28 space-y-8 sm:space-y-12" id="enterprise_home_experience">',
    '<div className="pb-28 space-y-6 sm:space-y-8" id="enterprise_home_experience">'
)

# 2. Make Smart Search more compact
content = content.replace(
    '<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-xl flex flex-col gap-2">',
    '<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-xl backdrop-blur-xl flex flex-col gap-1.5">'
)
content = content.replace(
    'py-3.5 pl-12 pr-28 text-sm',
    'py-2.5 pl-10 pr-28 text-xs'
)
content = content.replace(
    'className="absolute left-4 w-5 h-5 text-slate-500"',
    'className="absolute left-3 w-4 h-4 text-slate-500"'
)

# 3. Replace Primary Actions with smaller version
primary_actions_start = content.find('{/* 2. PRIMARY ACTIONS */}')
primary_actions_end = content.find('</section>', primary_actions_start) + len('</section>')

smaller_primary_actions = """{/* 2. PRIMARY ACTIONS */}
      <section className="grid grid-cols-2 gap-3 z-20 relative">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('marketplace')}
          className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 hover:border-indigo-500/40 p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide leading-tight">Buy Products</h3>
            <p className="text-[9px] sm:text-[10px] text-indigo-300/70 font-bold tracking-widest uppercase mt-0.5">Explore Market</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategorySelect('Services')}
          className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 hover:border-emerald-500/40 p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide leading-tight">Find Services</h3>
            <p className="text-[9px] sm:text-[10px] text-emerald-300/70 font-bold tracking-widest uppercase mt-0.5">Hire Experts</p>
          </div>
        </motion.button>
      </section>"""

content = content[:primary_actions_start] + smaller_primary_actions + content[primary_actions_end:]

# 4. Insert Secondary Seller Actions below hero slider
hero_slider_end = content.find('      )}', content.find('{/* 1. HERO ADVERTISEMENT SLIDER (ENTERPRISE AD ENGINE) */}')) + len('      )}')

secondary_seller_actions = """

      {/* 2.5 SECONDARY SELLER ACTIONS */}
      <section className="grid grid-cols-2 gap-3 z-20 relative">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wide leading-tight">Want to Sell Products?</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Open a Store</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wide leading-tight">Have a Skill / Service?</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Offer Expertise</p>
          </div>
        </motion.button>
      </section>"""

content = content[:hero_slider_end] + secondary_seller_actions + content[hero_slider_end:]

with open('src/components/marketplace/BuyerHome.tsx', 'w') as f:
    f.write(content)

print("Updates applied to BuyerHome.tsx")
