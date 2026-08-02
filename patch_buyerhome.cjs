const fs = require('fs');
let content = fs.readFileSync('src/components/marketplace/BuyerHome.tsx', 'utf8');

// Add import for aiEngineService
content = content.replace(
  "import { getProductImageUrl } from '../../utils/imageUtils';",
  "import { getProductImageUrl } from '../../utils/imageUtils';\nimport { aiEngineService, AIRecommendation } from '../../services/aiEngineService';"
);

// Add recommendations state
content = content.replace(
  "const [campaigns, setCampaigns] = useState<Campaign[]>([]);",
  "const [campaigns, setCampaigns] = useState<Campaign[]>([]);\n  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);"
);

// Fetch recommendations in useEffect
content = content.replace(
  "const activeCampaigns = await campaignService.getActiveCampaigns();",
  "const activeCampaigns = await campaignService.getActiveCampaigns();\n        const aiRecs = await aiEngineService.getRecommendations(user?.uid || 'guest', 6);\n        if (isMounted) setRecommendations(aiRecs);"
);

// Render recommendations section
const recommendationSection = `
      {/* ENTERPRISE AI RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Recommended For You
                  <span className="px-2 py-0.5 bg-violet-500/20 text-[10px] text-violet-400 font-bold uppercase rounded border border-violet-500/30">AI Powered</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Personalized selections based on your browsing history</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-violet-500/50 hover:shadow-violet-500/10 transition-all cursor-pointer" onClick={() => onNavigate(\`product/\${rec.id}\`)}>
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                  <LazyImage src={getProductImageUrl(rec.metadata)} alt={rec.title} />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-950/80 backdrop-blur border border-slate-700/50 rounded text-[9px] font-black text-violet-400">
                    {(rec.score * 100).toFixed(0)}% Match
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors">{rec.title}</h3>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkle className="w-3 h-3 text-violet-400" />
                    <span className="truncate">{rec.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
`;

content = content.replace(
  "{/* 1. HERO SLIDER CAROUSEL */}",
  recommendationSection + "\n      {/* 1. HERO SLIDER CAROUSEL */}"
);

fs.writeFileSync('src/components/marketplace/BuyerHome.tsx', content);
