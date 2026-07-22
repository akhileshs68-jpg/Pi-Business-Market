/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  Globe, 
  BookOpen, 
  Sparkles, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface DocsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  language: 'en' | 'hi' | 'dual';
  onLanguageChange: (lang: 'en' | 'hi' | 'dual') => void;
  onNavigateToDashboard: () => void;
  resultsCount: number;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  language,
  onLanguageChange,
  onNavigateToDashboard,
  resultsCount
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl shadow-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
          
          {/* BRAND & PORTAL TITLE */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20 border border-violet-400/30 font-bold text-lg">
              π
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  Pi Business Market
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                    Docs Portal
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span>Enterprise Documentation</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">v2.0 Production Spec</span>
              </p>
            </div>
          </div>

          {/* SEARCH & LANGUAGE TOOLS */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            
            {/* SEARCH INPUT */}
            <div className="relative flex-1 sm:w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  language === 'hi' 
                    ? 'खोजें (जैसे Escrow, KYC, Warehouse)...' 
                    : 'Search docs (e.g., Escrow, KYC, API)...'
                }
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* LANGUAGE MODE TOGGLE */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English Only"
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Easy Hindi / हिंदी"
              >
                हिंदी
              </button>
              <button
                onClick={() => onLanguageChange('dual')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  language === 'dual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dual View (English & Hindi)"
              >
                Dual
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLink}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
                title="Copy Documentation URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all hidden sm:flex"
                title="Print or Save PDF"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all ml-1"
              >
                <span>Live App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
