/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DocSection } from '../../data/documentationData';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { 
  CheckCircle2, 
  Lightbulb, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  ArrowLeft, 
  ArrowRight, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Workflow, 
  Copy,
  Clock
} from 'lucide-react';

interface DocsArticleProps {
  section: DocSection;
  language: 'en' | 'hi' | 'dual';
  prevSection?: DocSection;
  nextSection?: DocSection;
  onSelectSection: (id: string) => void;
}

export const DocsArticle: React.FC<DocsArticleProps> = ({
  section,
  language,
  prevSection,
  nextSection,
  onSelectSection
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <article className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans text-slate-200">
      
      {/* CATEGORY & TITLE HEADER */}
      <div className="mb-8 border-b border-slate-800 pb-6" id="article-top">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            {language === 'hi' ? section.categoryHi : section.categoryEn}
          </span>
          {section.badge && (
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {section.badge}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight mb-3">
          {language === 'hi' ? section.titleHi : section.titleEn}
        </h1>

        {language === 'dual' && (
          <h2 className="text-lg font-bold text-indigo-300 tracking-tight mb-3">
            {section.titleHi}
          </h2>
        )}

        {/* SUMMARY CALLOUT */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-inner">
          {language === 'hi' || language === 'dual' ? section.summaryHi : section.summaryEn}
        </p>

        {/* TABLE OF CONTENTS (In-Article Navigation) */}
        <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {language === 'hi' ? 'लेख की सूची' : 'In this Article'}
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { id: 'overview', labelEn: 'Overview', labelHi: 'अवलोकन' },
              { id: 'purpose', labelEn: 'Purpose', labelHi: 'उद्देश्य' },
              { id: 'how-it-works', labelEn: 'Workflow', labelHi: 'कार्यप्रणाली' },
              { id: 'benefits', labelEn: 'Benefits', labelHi: 'लाभ' },
              { id: 'faqs', labelEn: 'FAQs', labelHi: 'प्रश्न' }
            ].map((link) => (
              <a 
                key={link.id}
                href={`#${link.id}`}
                className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
              >
                <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-indigo-500" />
                {language === 'hi' ? link.labelHi : link.labelEn}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 1. OVERVIEW SECTION */}
      <section className="mb-10 scroll-mt-24" id="overview">
        <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center justify-between gap-2 font-sans border-l-4 border-indigo-500 pl-3">
          <span>{language === 'hi' ? '1. अवलोकन (Overview)' : '1. Overview'}</span>
          <a href="#article-top" className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors">↑ Top</a>
        </h2>
        
        {(language === 'en' || language === 'dual') && (
          <p className="text-sm text-slate-300 leading-relaxed mb-3">
            {section.overviewEn}
          </p>
        )}

        {(language === 'hi' || language === 'dual') && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 text-slate-200">
            <span className="font-semibold text-indigo-400 block mb-1">Easy Hindi:</span>
            {section.overviewHi}
          </p>
        )}
      </section>

      {/* 2. PURPOSE SECTION */}
      <section className="mb-10 scroll-mt-24" id="purpose">
        <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center justify-between gap-2 font-sans border-l-4 border-indigo-500 pl-3">
          <span>{language === 'hi' ? '2. उद्देश्य (Purpose)' : '2. Purpose'}</span>
          <a href="#article-top" className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors">↑ Top</a>
        </h2>

        {(language === 'en' || language === 'dual') && (
          <p className="text-sm text-slate-300 leading-relaxed mb-3">
            {section.purposeEn}
          </p>
        )}

        {(language === 'hi' || language === 'dual') && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 text-slate-200">
            <span className="font-semibold text-indigo-400 block mb-1">Easy Hindi:</span>
            {section.purposeHi}
          </p>
        )}
      </section>

      {/* 3. HOW IT WORKS (STEP-BY-STEP FLOW) */}
      <section className="mb-10 scroll-mt-24" id="how-it-works">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between gap-2 font-sans border-l-4 border-indigo-500 pl-3">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            {language === 'hi' ? '3. यह कैसे काम करता है (How It Works)' : '3. How It Works (Step-by-Step)'}
          </div>
          <a href="#article-top" className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors">↑ Top</a>
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {section.howItWorksSteps.map((step) => (
            <div 
              key={step.stepNumber}
              className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl shadow-md hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start gap-4"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-mono font-bold flex items-center justify-center shrink-0 shadow-md">
                0{step.stepNumber}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-100 mb-1">
                  {language === 'hi' ? step.titleHi : step.titleEn}
                </h3>
                {language === 'dual' && (
                  <h4 className="text-xs font-medium text-indigo-300 mb-1">
                    {step.titleHi}
                  </h4>
                )}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'hi' || language === 'dual' ? step.descriptionHi : step.descriptionEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE ARCHITECTURE DIAGRAM (IF SYSTEM ARCHITECTURE SECTION) */}
      {section.id === 'system-architecture' && (
        <ArchitectureDiagram language={language} />
      )}

      {/* 4. BENEFITS GRID */}
      <section className="mb-10 scroll-mt-24" id="benefits">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between gap-2 font-sans border-l-4 border-emerald-500 pl-3">
          <span>{language === 'hi' ? '4. प्रमुख लाभ (Benefits)' : '4. Benefits'}</span>
          <a href="#article-top" className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors">↑ Top</a>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(language === 'hi' ? section.benefitsHi : section.benefitsEn).map((benefit, idx) => (
            <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300 leading-relaxed">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TIPS CALLOUT CARD */}
      <section className="mb-6">
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300 font-sans">
              {language === 'hi' ? 'टिप्स और सुझाव (Tips)' : 'Tips & Recommendations'}
            </h3>
          </div>
          <ul className="space-y-2 pl-2">
            {(language === 'hi' ? section.tipsHi : section.tipsEn).map((tip, idx) => (
              <li key={idx} className="text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. BEST PRACTICES CARD */}
      <section className="mb-6">
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300 font-sans">
              {language === 'hi' ? 'सर्वश्रेष्ठ तरीके (Best Practices)' : 'Best Practices'}
            </h3>
          </div>
          <ul className="space-y-2 pl-2">
            {(language === 'hi' ? section.bestPracticesHi : section.bestPracticesEn).map((bp, idx) => (
              <li key={idx} className="text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                <span>{bp}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. NOTES & WARNINGS CARD */}
      <section className="mb-10">
        <div className="p-4 bg-violet-950/30 border border-violet-500/30 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-bold text-violet-300 font-sans">
              {language === 'hi' ? 'विशेष बिंदु व चेतावनियाँ (Notes & Warnings)' : 'Notes & Important Guidelines'}
            </h3>
          </div>
          <ul className="space-y-2 pl-2">
            {(language === 'hi' ? section.notesHi : section.notesEn).map((note, idx) => (
              <li key={idx} className="text-xs text-violet-200/90 leading-relaxed flex items-start gap-2">
                <span className="text-violet-400">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. FAQS ACCORDION */}
      <section className="mb-12 scroll-mt-24" id="faqs">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between gap-2 font-sans border-l-4 border-amber-500 pl-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQs)' : 'Frequently Asked Questions (FAQs)'}
          </div>
          <a href="#article-top" className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors">↑ Top</a>
        </h2>

        <div className="space-y-3">
          {section.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-100 hover:text-indigo-400 transition-colors"
                >
                  <span>
                    {language === 'hi' ? faq.questionHi : faq.questionEn}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/60 bg-slate-950/40 leading-relaxed">
                    {(language === 'en' || language === 'dual') && (
                      <p className="mb-2">{faq.answerEn}</p>
                    )}
                    {(language === 'hi' || language === 'dual') && (
                      <p className="text-slate-200 font-sans">{faq.answerHi}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ARTICLE HELPFULNESS FEEDBACK */}
      <div className="mb-8 p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-300 font-medium">
          {language === 'hi' ? 'क्या यह जानकारी आपके लिए उपयोगी थी?' : 'Was this documentation article helpful?'}
        </span>
        
        {feedbackGiven ? (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
            <Check className="w-4 h-4" />
            {language === 'hi' ? 'प्रतिक्रिया के लिए धन्यवाद!' : 'Thank you for your feedback!'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedbackGiven('up')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-all flex items-center gap-1.5"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yes</span>
            </button>
            <button
              onClick={() => setFeedbackGiven('down')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-all flex items-center gap-1.5"
            >
              <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
              <span>No</span>
            </button>
          </div>
        )}
      </div>

      {/* RELATED TOPICS (Internal Linking) */}
      {section.relatedSectionIds && section.relatedSectionIds.length > 0 && (
        <section className="mb-10 p-6 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl">
          <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wider font-mono">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            {language === 'hi' ? 'संबंधित विषय (Related Topics)' : 'Related Documentation Topics'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.relatedSectionIds.map(relId => {
              // Find the related section object - Note: Ideally DOCUMENTATION_DATA should be imported or passed down
              // For simplicity, we'll just show buttons that link to the IDs
              return (
                <button
                  key={relId}
                  onClick={() => onSelectSection(relId)}
                  className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all flex items-center gap-3 group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white capitalize truncate">
                    {relId.replace(/-/g, ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* PREVIOUS / NEXT ARTICLE JUMP BUTTONS */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {prevSection ? (
          <button
            onClick={() => onSelectSection(prevSection.id)}
            className="w-full sm:w-auto p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all flex items-center gap-3 group"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-1 transition-transform shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Previous</span>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-[200px] block">
                {language === 'hi' ? prevSection.titleHi : prevSection.titleEn}
              </span>
            </div>
          </button>
        ) : <div />}

        {nextSection ? (
          <button
            onClick={() => onSelectSection(nextSection.id)}
            className="w-full sm:w-auto p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-right transition-all flex items-center justify-end gap-3 group"
          >
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Next</span>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-[200px] block">
                {language === 'hi' ? nextSection.titleHi : nextSection.titleEn}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        ) : <div />}
      </div>

    </article>
  );
};
