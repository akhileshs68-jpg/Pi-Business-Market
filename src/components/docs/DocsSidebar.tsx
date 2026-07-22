/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DocSection } from '../../data/documentationData';
import { 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  UserCheck, 
  Zap, 
  HelpCircle,
  Compass,
  Store,
  Warehouse,
  Users
} from 'lucide-react';

interface DocsSidebarProps {
  sections: DocSection[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  language: 'en' | 'hi' | 'dual';
  onNavigateToApp: (route: string) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  language,
  onNavigateToApp
}) => {
  // Group sections by category
  const categoriesMap = new Map<string, DocSection[]>();
  sections.forEach((sec) => {
    const cat = language === 'hi' ? sec.categoryHi : sec.categoryEn;
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, []);
    }
    categoriesMap.get(cat)!.push(sec);
  });

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 font-sans text-slate-300">
      
      {/* NAVIGATION TITLE */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          {language === 'hi' ? 'डॉक्यूमेंटेशन इंडेक्स' : 'Documentation Navigation'}
        </h2>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {sections.length} Topics
        </span>
      </div>

      {/* DOCUMENTATION CATEGORY GROUPS */}
      <div className="space-y-6">
        {Array.from(categoriesMap.entries()).map(([category, items]) => (
          <div key={category} className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2 py-1">
              {category}
            </h3>
            
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.id === activeSectionId;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md shadow-indigo-950/30 border border-indigo-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="truncate pr-2">
                      {language === 'hi' ? item.titleHi : item.titleEn}
                    </span>
                    
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* QUICK LIVE APP LINKS */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2">
          {language === 'hi' ? 'लाइव ऐप क्विक लिंक्स' : 'Live Modules Shortcut'}
        </h3>
        
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => onNavigateToApp('/catalog')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all text-left"
          >
            <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Catalog</span>
          </button>

          <button
            onClick={() => onNavigateToApp('/warehouses')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all text-left"
          >
            <Warehouse className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Warehouses</span>
          </button>

          <button
            onClick={() => onNavigateToApp('/crm')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all text-left"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">CRM 360</span>
          </button>

          <button
            onClick={() => onNavigateToApp('/discovery')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all text-left"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Discovery</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
