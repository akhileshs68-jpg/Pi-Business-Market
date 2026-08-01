import React from 'react';
import { 
  ShoppingBag, 
  Zap, 
  Building2, 
  Briefcase, 
  Cpu, 
  GraduationCap, 
  Sprout, 
  Heart, 
  Car, 
  LayoutGrid 
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  count?: string;
  bgGlow: string;
}

const CATEGORIES: CategoryItem[] = [
  { 
    id: 'product', 
    name: 'Products', 
    icon: ShoppingBag, 
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', 
    bgGlow: 'from-emerald-500/10 to-transparent',
    count: '2.4k+ items'
  },
  { 
    id: 'service', 
    name: 'Services', 
    icon: Zap, 
    color: 'text-violet-400 border-violet-500/20 bg-violet-500/5', 
    bgGlow: 'from-violet-500/10 to-transparent',
    count: '1.2k+ services'
  },
  { 
    id: 'business', 
    name: 'Businesses', 
    icon: Building2, 
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', 
    bgGlow: 'from-amber-500/10 to-transparent',
    count: '840+ companies'
  },
  { 
    id: 'job', 
    name: 'Jobs', 
    icon: Briefcase, 
    color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5', 
    bgGlow: 'from-indigo-500/10 to-transparent',
    count: '310+ open roles'
  },
  { 
    id: 'digital', 
    name: 'Digital Products', 
    icon: Cpu, 
    color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', 
    bgGlow: 'from-cyan-500/10 to-transparent',
    count: '540+ resources'
  },
  { 
    id: 'education', 
    name: 'Education', 
    icon: GraduationCap, 
    color: 'text-pink-400 border-pink-500/20 bg-pink-500/5', 
    bgGlow: 'from-pink-500/10 to-transparent',
    count: '180+ courses'
  },
  { 
    id: 'agriculture', 
    name: 'Agriculture', 
    icon: Sprout, 
    color: 'text-green-400 border-green-500/20 bg-green-500/5', 
    bgGlow: 'from-green-500/10 to-transparent',
    count: '95+ merchants'
  },
  { 
    id: 'healthcare', 
    name: 'Healthcare', 
    icon: Heart, 
    color: 'text-rose-400 border-rose-500/20 bg-rose-500/5', 
    bgGlow: 'from-rose-500/10 to-transparent',
    count: '110+ services'
  },
  { 
    id: 'transportation', 
    name: 'Transportation', 
    icon: Car, 
    color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', 
    bgGlow: 'from-blue-500/10 to-transparent',
    count: '75+ providers'
  },
  { 
    id: 'more', 
    name: 'More...', 
    icon: LayoutGrid, 
    color: 'text-slate-400 border-slate-700/50 bg-slate-800/20', 
    bgGlow: 'from-slate-500/5 to-transparent',
    count: 'Browse other'
  },
];

interface CategorySectionProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ onSelectCategory }) => {
  return (
    <div id="buyer_category_section" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-violet-500 rounded-full inline-block" />
          Explore Categories
        </h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Scrollable Grid
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              id={`category_card_${cat.id}`}
              className={`group relative overflow-hidden text-left p-5 rounded-2xl border ${cat.color} hover:border-violet-500/40 transition-all duration-300 shadow-lg cursor-pointer bg-slate-900/40 backdrop-blur-sm active:scale-[0.98]`}
            >
              {/* Radial background glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="p-3 bg-slate-950/60 rounded-xl w-fit group-hover:scale-110 group-hover:bg-slate-950 transition-all duration-300">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-200 tracking-tight group-hover:text-white transition-colors">
                    {cat.name}
                  </h3>
                  {cat.count && (
                    <span className="text-[9px] font-medium text-slate-500 block mt-0.5">
                      {cat.count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
