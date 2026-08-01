import re

with open('src/pages/MarketplacePage.tsx', 'r') as f:
    content = f.read()

# Add states for new filters
old_states = """  const [businessType, setBusinessType] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);"""

new_states = """  const [businessType, setBusinessType] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [locationStr, setLocationStr] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevant');"""

content = content.replace(old_states, new_states)

# Replace the entity type filters with a more robust top bar
old_top_bar = """                <div className="max-w-3xl mx-auto">
                  {/* Entity Type Filters - Compact */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2">
                    {[
                      { id: 'all', label: 'All', icon: LayoutGrid },
                      { id: 'product', label: 'Products', icon: ShoppingBag },
                      { id: 'service', label: 'Services', icon: Zap },
                      { id: 'job', label: 'Jobs', icon: Briefcase },
                      { id: 'business', label: 'Businesses', icon: Building2 },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setActiveType(type.id as any)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                          activeType === type.id 
                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <type.icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>"""

new_top_bar = """                <div className="w-full mt-6">
                  {/* Entity Type Filters & Sort & Advanced toggle */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'all', label: 'All', icon: LayoutGrid },
                        { id: 'product', label: 'Products', icon: ShoppingBag },
                        { id: 'service', label: 'Services', icon: Zap },
                        { id: 'job', label: 'Jobs', icon: Briefcase },
                        { id: 'business', label: 'Businesses', icon: Building2 },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setActiveType(type.id as any)}
                          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                            activeType === type.id 
                              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <type.icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] sm:text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-violet-500 uppercase tracking-widest appearance-none"
                      >
                        <option value="relevant">Most Relevant</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="newest">Newest Arrivals</option>
                      </select>
                      
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                          showFilters 
                            ? 'bg-violet-600 border-violet-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4" /> Filters
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable Advanced Filters Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 mt-4 bg-slate-900/50 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Category / Business Type</label>
                            <input 
                              type="text"
                              value={businessType}
                              onChange={(e) => setBusinessType(e.target.value)}
                              placeholder="e.g. Electronics, Cafe..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Max Price ({priceRange[1]} Pi)</label>
                            <input 
                              type="range"
                              min="0"
                              max="10000"
                              step="10"
                              value={priceRange[1]}
                              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                              className="w-full accent-violet-500 mt-2"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Location</label>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-500" />
                              <input 
                                type="text"
                                value={locationStr}
                                onChange={(e) => setLocationStr(e.target.value)}
                                placeholder="City or Region"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Quality</label>
                            <div className="flex items-center gap-4 h-[34px]">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                <input 
                                  type="checkbox" 
                                  checked={isVerified || false}
                                  onChange={(e) => setIsVerified(e.target.checked ? true : undefined)}
                                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900" 
                                />
                                Verified Only
                              </label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>"""

content = content.replace(old_top_bar, new_top_bar)

with open('src/pages/MarketplacePage.tsx', 'w') as f:
    f.write(content)
