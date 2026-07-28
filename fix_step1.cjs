const fs = require('fs');
let code = fs.readFileSync('src/components/business/BusinessWizard.tsx', 'utf8');

const s1Start = code.indexOf('{step === 1 && (');
const s2Start = code.indexOf('{step === 2 && (');

if (s1Start !== -1 && s2Start !== -1) {
  const newStep1 = `{step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">What best describes your business?</h3>
                    <p className="text-slate-400">Select the category that matches your primary operations.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessType: type.id })}
                        aria-pressed={formData.businessType === type.id}
                        className={\`p-5 rounded-2xl border text-left transition-all flex flex-col gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 \${
                          formData.businessType === type.id 
                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                        }\`}
                      >
                        <div className={\`p-3 rounded-xl inline-flex w-fit \${formData.businessType === type.id ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800/80 text-slate-400'}\`}>
                          <type.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={\`text-base font-bold mb-1 \${formData.businessType === type.id ? 'text-indigo-300' : 'text-slate-200'}\`}>
                            {type.label}
                          </p>
                          <p className={\`text-xs leading-relaxed \${formData.businessType === type.id ? 'text-indigo-200/70' : 'text-slate-500'}\`}>
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              `;
  code = code.substring(0, s1Start) + newStep1 + code.substring(s2Start);
  fs.writeFileSync('src/components/business/BusinessWizard.tsx', code);
  console.log('Fixed step 1.');
} else {
  console.log('Could not find indices.');
}
