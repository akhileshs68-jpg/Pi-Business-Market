const fs = require('fs');
let code = fs.readFileSync('src/pages/UniversalSearch.tsx', 'utf8');

if (!code.includes('const [businessType,')) {
  code = code.replace(/const \[activeType, setActiveType\] = useState<SearchEntityType \| 'all'>\('all'\);/, 
`const [activeType, setActiveType] = useState<SearchEntityType | 'all'>('all');
  const [businessType, setBusinessType] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);
`);
}

code = code.replace(/const filters = activeType === 'all' \? \{\} : \{ entityType: activeType \};/, 
`const filters: any = activeType === 'all' ? {} : { entityType: activeType };
      if (activeType === 'business' || activeType === 'all') {
        if (businessType) filters.businessType = businessType;
        if (minRating > 0) filters.minRating = minRating;
        if (isVerified !== undefined) filters.isVerified = isVerified;
      }
`);

// Now add the UI for it
const filterUI = `
            {/* Extended Filters */}
            {(activeType === 'business' || activeType === 'all') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-[#090d16] border border-slate-800 rounded-2xl flex flex-wrap gap-4 items-end"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Type</label>
                  <select 
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                    className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="Product Seller">Product Seller</option>
                    <option value="Service Provider">Service Provider</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Professional">Professional</option>
                    <option value="Agriculture / Farmer">Agriculture / Farmer</option>
                    <option value="Local Shop">Local Shop</option>
                    <option value="Company">Company</option>
                    <option value="Startup">Startup</option>
                    <option value="NGO">NGO</option>
                    <option value="Artist / Creator">Artist / Creator</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min Rating</label>
                  <select 
                    value={minRating} 
                    onChange={e => setMinRating(Number(e.target.value))}
                    className="w-full sm:w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="0">Any</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verification</label>
                  <select 
                    value={isVerified === undefined ? 'all' : (isVerified ? 'true' : 'false')} 
                    onChange={e => {
                      const val = e.target.value;
                      setIsVerified(val === 'all' ? undefined : val === 'true');
                    }}
                    className="w-full sm:w-40 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
              </motion.div>
            )}
`;

code = code.replace(/<\/div>\s*<\/div>\s*\{\/\* Search Results \*\/\}/, `</div>\n${filterUI}\n          </div>\n\n          {/* Search Results */}`);


fs.writeFileSync('src/pages/UniversalSearch.tsx', code);
