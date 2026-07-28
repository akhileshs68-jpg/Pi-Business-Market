const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

// 1. Update TabType
code = code.replace(/type TabType = 'overview' \| 'members' \| 'documents' \| 'verification' \| 'activity' \| 'settings';/, "type TabType = 'overview' | 'profile' | 'members' | 'documents' | 'verification' | 'activity' | 'settings';");

// 2. Add tab to mapping array
code = code.replace(/\{ id: 'overview', label: 'Overview', icon: BarChart3 \},/, "{ id: 'overview', label: 'Overview', icon: BarChart3 },\n            { id: 'profile', label: 'Business Profile', icon: Briefcase },");

// 3. Add Tab render content (we'll just append it before `activeTab === 'members'`)
const profileTabContent = `
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-8"
              >
                <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                  <h2 className="text-xl font-bold text-white mb-2">Business Profile Details</h2>
                  <p className="text-sm text-slate-500 mb-8">Specialized profile fields based on your business type.</p>
                  
                  {business.profileData && Object.keys(business.profileData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(business.profileData).map(([key, val]) => (
                        <div key={key} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-slate-200 font-medium">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">No specialized profile data configured for this business.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
`;

code = code.replace(/\{activeTab === 'members' && \(/, profileTabContent + "\n            {activeTab === 'members' && (");

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
