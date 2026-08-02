const fs = require('fs');
let content = fs.readFileSync('src/components/business/BusinessHub.tsx', 'utf8');

// Add import
content = content.replace(
  "import { UniversalBusinessService, BusinessOverview } from '../../services/universalBusinessService';",
  "import { UniversalBusinessService, BusinessOverview } from '../../services/universalBusinessService';\nimport { aiEngineService, BusinessInsight } from '../../services/aiEngineService';"
);

// Add state
content = content.replace(
  "const [overview, setOverview] = useState<BusinessOverview | null>(null);",
  "const [overview, setOverview] = useState<BusinessOverview | null>(null);\n  const [aiInsights, setAiInsights] = useState<BusinessInsight[]>([]);"
);

// Fetch data
content = content.replace(
  "const data = await UniversalBusinessService.getBusinessOverview(business.id);",
  "const data = await UniversalBusinessService.getBusinessOverview(business.id);\n      const insights = await aiEngineService.getBusinessInsights(business.id);\n      setAiInsights(insights);"
);

// Render AI panel
const aiPanel = `
      {/* ENTERPRISE AI INSIGHTS */}
      {aiInsights.length > 0 && activeTab === 'overview' && (
        <div className="mb-6 bg-gradient-to-r from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-violet-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Enterprise AI Assistant
                <span className="px-2 py-0.5 bg-violet-500/20 text-[10px] font-bold text-violet-300 rounded uppercase border border-violet-500/30">Active</span>
              </h3>
              <p className="text-xs text-violet-200/60 mt-0.5">Real-time intelligent recommendations for your business.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {aiInsights.map(insight => (
              <div key={insight.insightId} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-violet-500/40 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {insight.type === 'pricing' && <Tag className="w-4 h-4 text-emerald-400" />}
                    {insight.type === 'sales_forecast' && <TrendingUp className="w-4 h-4 text-blue-400" />}
                    {insight.type === 'seo' && <Search className="w-4 h-4 text-amber-400" />}
                    <h4 className="text-sm font-bold text-slate-200">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{insight.description}</p>
                </div>
                {insight.actionable && (
                  <button className="self-start text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    Apply Suggestion <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
`;

content = content.replace(
  "{activeTab === 'overview' && overview && (",
  aiPanel + "\n        {activeTab === 'overview' && overview && ("
);

fs.writeFileSync('src/components/business/BusinessHub.tsx', content);
