/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOCUMENTATION_DATA, DocSection } from '../data/documentationData';
import { DocsHeader } from '../components/docs/DocsHeader';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { DocsArticle } from '../components/docs/DocsArticle';
import { Search, Sparkles, BookOpen, AlertCircle, X } from 'lucide-react';

export const DocumentationPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState<string>('welcome');
  const [language, setLanguage] = useState<'en' | 'hi' | 'dual'>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCUMENTATION_DATA;
    const q = searchQuery.toLowerCase().trim();
    return DOCUMENTATION_DATA.filter((sec) => {
      return (
        sec.titleEn.toLowerCase().includes(q) ||
        sec.titleHi.toLowerCase().includes(q) ||
        sec.overviewEn.toLowerCase().includes(q) ||
        sec.overviewHi.toLowerCase().includes(q) ||
        sec.categoryEn.toLowerCase().includes(q) ||
        sec.categoryHi.toLowerCase().includes(q) ||
        (sec.keywords && sec.keywords.some(k => k.toLowerCase().includes(q))) ||
        sec.faqs.some(f => f.questionEn.toLowerCase().includes(q) || f.questionHi.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Active section finding
  const activeSection = useMemo(() => {
    return DOCUMENTATION_DATA.find(s => s.id === activeSectionId) || DOCUMENTATION_DATA[0];
  }, [activeSectionId]);

  // Indexing for Prev / Next section navigation
  const activeIndex = useMemo(() => {
    return DOCUMENTATION_DATA.findIndex(s => s.id === activeSection.id);
  }, [activeSection]);

  const prevSection = activeIndex > 0 ? DOCUMENTATION_DATA[activeIndex - 1] : undefined;
  const nextSection = activeIndex < DOCUMENTATION_DATA.length - 1 ? DOCUMENTATION_DATA[activeIndex + 1] : undefined;

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER BAR */}
      <DocsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
        onNavigateToDashboard={() => navigate('/dashboard')}
        resultsCount={filteredSections.length}
      />

      {/* MOBILE SIDEBAR TOGGLE */}
      <div className="lg:hidden sticky top-[57px] z-30 bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shadow-lg">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 text-xs font-bold text-slate-300"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          {language === 'hi' ? 'विषय सूची' : 'Documentation Index'}
        </button>
        <div className="text-[10px] font-mono text-slate-500">
          Topic: {activeSection.id}
        </div>
      </div>

      {/* MAIN DOCUMENTATION HUB BODY */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row relative">
        
        {/* SIDEBAR - WITH MOBILE OVERLAY LOGIC */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100'}
          fixed lg:static inset-0 top-[57px] lg:top-0 z-40 lg:z-0 bg-slate-950/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
          transition-all duration-300 ease-in-out w-full lg:w-auto
        `}>
          <DocsSidebar
            sections={filteredSections}
            activeSectionId={activeSection.id}
            onSelectSection={handleSelectSection}
            language={language}
            onNavigateToApp={(route) => navigate(route)}
          />
          
          {/* MOBILE CLOSE OVERLAY */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shadow-xl border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT CONTAINER */}
        <main className="flex-1 bg-slate-950 min-h-[calc(100vh-4rem)]">
          {filteredSections.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto my-12 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-base font-bold text-slate-100 mb-1">
                {language === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No Documentation Topics Found'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {language === 'hi' 
                  ? `"${searchQuery}" के लिए कोई लेख नहीं मिला। कृपया अलग शब्द खोजें।`
                  : `No guides match "${searchQuery}". Try searching for terms like "Escrow", "KYC", or "Warehouse".`}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <DocsArticle
              section={activeSection}
              language={language}
              prevSection={prevSection}
              nextSection={nextSection}
              onSelectSection={handleSelectSection}
            />
          )}
        </main>

      </div>

      {/* ENTERPRISE FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Pi Business Market. Enterprise Web3 Commerce Protocol.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-indigo-400 cursor-pointer" onClick={() => handleSelectSection('welcome')}>
              Welcome
            </span>
            <span>•</span>
            <span className="hover:text-indigo-400 cursor-pointer" onClick={() => handleSelectSection('system-architecture')}>
              System Architecture
            </span>
            <span>•</span>
            <span className="hover:text-indigo-400 cursor-pointer" onClick={() => handleSelectSection('documentation-navigation')}>
              Navigation Manual
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default DocumentationPortal;
