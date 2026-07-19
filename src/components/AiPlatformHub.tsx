/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Database,
  Shield,
  Activity,
  Coins,
  History,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Send,
  Zap,
  Lock,
  Globe,
  FileText,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  Fingerprint
} from 'lucide-react';
import { User as UserType } from '../types';
import {
  AIPlatformAbstraction,
  AIProviderId,
  AIGovernanceMetadata,
  AIAuditLog,
  StoreSetupAdvice,
  OptimizedContent,
  SupportAutomationResult,
  SemanticSearchAnalysis,
  BusinessInsights,
  FraudRiskScore,
  TranslationResult,
  AutomationWorkflowResult
} from '../services/aiProvider';

interface AiPlatformHubProps {
  currentUser: UserType;
  onNavigate: (view: string) => void;
}

const aiPlatform = new AIPlatformAbstraction();

export const AiPlatformHub: React.FC<AiPlatformHubProps> = ({ currentUser, onNavigate }) => {
  // Config state
  const [activeTab, setActiveTab] = useState<'sandbox' | 'providers' | 'audit' | 'security' | 'reports'>('sandbox');
  const [activePillar, setActivePillar] = useState<'assistant' | 'studio' | 'support' | 'search' | 'analytics' | 'fraud' | 'translation' | 'automation'>('assistant');
  
  // Selected configuration
  const [activeProvider, setActiveProvider] = useState<AIProviderId>('gemini');
  const [providersList, setProvidersList] = useState(aiPlatform.getProviders());
  const [auditLogs, setAuditLogs] = useState<AIAuditLog[]>(aiPlatform.getAuditLogs());
  
  // Global stats simulation
  const [totalRequests, setTotalRequests] = useState(148);
  const [accumulatedCost, setAccumulatedCost] = useState(0.4852);
  const [averageLatency, setAverageLatency] = useState(482);
  const [activeDefenses, setActiveDefenses] = useState({
    promptInjection: true,
    dataLeakage: true,
    crossTenantIsolation: true,
    unsafeContentFilter: true
  });

  // Action status loading states
  const [loading, setLoading] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<AIGovernanceMetadata | null>(null);

  // Pillar 1: Business Assistant Input/Output
  const [assistantInput, setAssistantInput] = useState({
    storeName: 'Pioneer Node Depot',
    category: 'Hardware & Nodes',
    budget: 'Medium'
  });
  const [assistantOutput, setAssistantOutput] = useState<StoreSetupAdvice | null>(null);

  // Pillar 2: Content Studio Input/Output
  const [studioInput, setStudioInput] = useState({
    title: 'Dual-Fan Pi Case 4B',
    description: 'High quality aluminum case with active dual fans for stable 24/7 Pi Node processing.',
    category: 'Node Accessories'
  });
  const [studioOutput, setStudioOutput] = useState<OptimizedContent | null>(null);

  // Pillar 3: Customer Support Input/Output
  const [supportInput, setSupportInput] = useState({
    subject: 'Escrow Dispute: Package not received',
    description: 'The tracking number 1Z99999 shows pending since 4 days. Seller is not replying. Please release my escrow funds back.'
  });
  const [supportOutput, setSupportOutput] = useState<SupportAutomationResult | null>(null);

  // Pillar 4: Search & Discovery Input/Output
  const [searchInput, setSearchInput] = useState('certified high-grade hardware nodes with active cooling');
  const [searchOutput, setSearchOutput] = useState<SemanticSearchAnalysis | null>(null);

  // Pillar 5: Business Analytics Output
  const [analyticsOutput, setAnalyticsOutput] = useState<BusinessInsights | null>(null);

  // Pillar 6: Fraud & Risk Input/Output
  const [riskInput, setRiskInput] = useState({
    content: 'Guaranteed 500% returns in 3 days! Whatsapp me now at +1-555-0199 for off-escrow quick cash trading of your Pi coins.',
    userScore: 25
  });
  const [riskOutput, setRiskOutput] = useState<FraudRiskScore | null>(null);

  // Pillar 7: Translation Input/Output
  const [translationInput, setTranslationInput] = useState({
    text: 'Hello Pioneer! Your dual-fan Pi node accessory has been safely locked into escrow protection and is ready to ship.',
    targetLang: 'Spanish'
  });
  const [translationOutput, setTranslationOutput] = useState<TranslationResult | null>(null);

  // Pillar 8: Automation Input/Output
  const [automationInput, setAutomationInput] = useState({
    title: 'Senior React Developer with Pi SDK Experience Needed',
    content: 'We are expanding our super app team. Seeking localized engineer to implement escrow webhook integrations. Compensation: 450 Pi/month.'
  });
  const [automationOutput, setAutomationOutput] = useState<AutomationWorkflowResult | null>(null);

  // Sync state with service layer on load
  useEffect(() => {
    aiPlatform.setActiveProvider(activeProvider);
    setProvidersList(aiPlatform.getProviders());
    setAuditLogs(aiPlatform.getAuditLogs());
  }, [activeProvider]);

  const handleProviderChange = (id: AIProviderId) => {
    setActiveProvider(id);
    aiPlatform.setActiveProvider(id);
  };

  const handleToggleProvider = (id: AIProviderId) => {
    aiPlatform.toggleProviderEnabled(id);
    setProvidersList(aiPlatform.getProviders());
  };

  const updateStats = (meta: AIGovernanceMetadata) => {
    setTotalRequests(prev => prev + 1);
    setAccumulatedCost(prev => prev + meta.estimatedCostPi);
    setAverageLatency(prev => Math.floor((prev * 9 + meta.latencyMs) / 10));
    setAuditLogs(aiPlatform.getAuditLogs());
  };

  // Run Sandbox Simulation Actions
  const runAssistant = async () => {
    setLoading(true);
    setAssistantOutput(null);
    try {
      const res = await aiPlatform.getBusinessSetupAdvice(
        assistantInput.storeName,
        assistantInput.category,
        assistantInput.budget
      );
      setAssistantOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runStudio = async () => {
    setLoading(true);
    setStudioOutput(null);
    try {
      const res = await aiPlatform.generateOptimizedContent(
        studioInput.title,
        studioInput.description,
        studioInput.category
      );
      setStudioOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runSupport = async () => {
    setLoading(true);
    setSupportOutput(null);
    try {
      const res = await aiPlatform.analyzeSupportTicket(
        supportInput.subject,
        supportInput.description
      );
      setSupportOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async () => {
    setLoading(true);
    setSearchOutput(null);
    try {
      const res = await aiPlatform.analyzeSemanticQuery(searchInput);
      setSearchOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAnalytics = async () => {
    setLoading(true);
    setAnalyticsOutput(null);
    try {
      const res = await aiPlatform.getAnalyticsInsights();
      setAnalyticsOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runRisk = async () => {
    setLoading(true);
    setRiskOutput(null);
    try {
      const res = await aiPlatform.evaluateRisk(
        riskInput.content,
        riskInput.userScore
      );
      setRiskOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runTranslation = async () => {
    setLoading(true);
    setTranslationOutput(null);
    try {
      const res = await aiPlatform.translateText(
        translationInput.text,
        translationInput.targetLang
      );
      setTranslationOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async () => {
    setLoading(true);
    setAutomationOutput(null);
    try {
      const res = await aiPlatform.triggerAutomationWorkflow(
        automationInput.title,
        automationInput.content
      );
      setAutomationOutput(res.data);
      setCurrentMetadata(res.metadata);
      updateStats(res.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="ai_platform_hub_container">
      {/* ENTERPRISE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Phase 9 Production Environment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white flex items-center gap-2">
              Enterprise AI Platform
              <span className="text-xs font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-md">V1.0</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl font-medium">
              Provider-agnostic intelligence abstraction layer powering automated setup, advanced risk audits, multilingual translations, content generation, and demand forecasting.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('discovery_engine')}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold hover:bg-slate-850 transition-all"
              id="btn_back_to_discovery"
            >
              Back to Discovery
            </button>
            <button
              onClick={() => onNavigate('marketplace_core')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
              id="btn_back_to_unified"
            >
              Unified Core Engine
            </button>
          </div>
        </div>

        {/* METRIC CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/60">
          <div className="bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Active Model Provider</p>
              <p className="text-xs font-extrabold text-white font-mono mt-0.5">
                {providersList.find(p => p.id === activeProvider)?.name.split(' (')[0] || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Audited AI Queries</p>
              <p className="text-sm font-extrabold text-white font-mono mt-0.5">{totalRequests} Calls</p>
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Accumulated Cost</p>
              <p className="text-sm font-extrabold text-white font-mono mt-0.5">{accumulatedCost.toFixed(6)} Pi</p>
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Average Latency</p>
              <p className="text-sm font-extrabold text-white font-mono mt-0.5">{averageLatency} ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE SECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDE BAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 font-mono">Platform Sectors</p>
            
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Intelligence Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('providers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'providers'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Provider Abstraction</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Isolation</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log Ledger</span>
            </button>
          </div>

          {/* ACTIVE PROVIDER FAST SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300">Fast-Switch Provider</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Instantly hot-swap underlying LLM pipelines without editing backend code.</p>
            </div>
            
            <div className="space-y-1.5">
              {providersList.map((p) => (
                <button
                  key={p.id}
                  disabled={!p.enabled}
                  onClick={() => handleProviderChange(p.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                    !p.enabled
                      ? 'opacity-40 cursor-not-allowed border-slate-800/40 bg-slate-950/10'
                      : p.id === activeProvider
                      ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className={`w-3.5 h-3.5 shrink-0 ${p.id === activeProvider ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{p.name.split(' (')[0]}</p>
                      <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{p.modelName}</p>
                    </div>
                  </div>
                  {p.id === activeProvider && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-2 animate-ping"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WORKSPACE CENTRAL DISPATCH */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: SANDBOX TESTING */}
          {activeTab === 'sandbox' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* PILLARS NAV */}
              <div className="border-b border-slate-800 bg-slate-950/60 p-2 overflow-x-auto flex gap-1 scrollbar-none">
                {[
                  { id: 'assistant', label: 'Setup Assist', icon: Bot },
                  { id: 'studio', label: 'Content Studio', icon: FileText },
                  { id: 'support', label: 'Support SLA', icon: Sparkles },
                  { id: 'search', label: 'Semantic Search', icon: Search },
                  { id: 'analytics', label: 'Analytics Insights', icon: TrendingUp },
                  { id: 'fraud', label: 'Fraud Score', icon: Shield },
                  { id: 'translation', label: 'Multilingual', icon: Globe },
                  { id: 'automation', label: 'Automation', icon: Layers }
                ].map((p) => {
                  const IconComp = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePillar(p.id as any);
                        setCurrentMetadata(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        activePillar === p.id
                          ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${activePillar === p.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* PILLAR DETAILED FORM & SIMULATED EXECUTION */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* WORKSPACE PARAMETER FORM */}
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-white tracking-tight uppercase font-mono">Sandbox Parameters</h2>
                      <p className="text-xs text-slate-500 font-medium">Manipulate core inputs for simulated provider evaluation.</p>
                    </div>

                    {/* ASSISTANT FORM */}
                    {activePillar === 'assistant' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Suggested Store Name</label>
                          <input
                            type="text"
                            value={assistantInput.storeName}
                            onChange={(e) => setAssistantInput({ ...assistantInput, storeName: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Business Category</label>
                          <select
                            value={assistantInput.category}
                            onChange={(e) => setAssistantInput({ ...assistantInput, category: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          >
                            <option value="Hardware & Nodes">Hardware & Nodes</option>
                            <option value="Home Maintenance Services">Home Maintenance Services</option>
                            <option value="P2P Delivery Agents">P2P Delivery Agents</option>
                            <option value="Custom Software Licences">Custom Software Licences</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* CONTENT STUDIO FORM */}
                    {activePillar === 'studio' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Raw Product Title</label>
                          <input
                            type="text"
                            value={studioInput.title}
                            onChange={(e) => setStudioInput({ ...studioInput, title: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Unformatted Description</label>
                          <textarea
                            value={studioInput.description}
                            onChange={(e) => setStudioInput({ ...studioInput, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none h-24 resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* CUSTOMER SUPPORT FORM */}
                    {activePillar === 'support' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ticket Subject</label>
                          <input
                            type="text"
                            value={supportInput.subject}
                            onChange={(e) => setSupportInput({ ...supportInput, subject: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Complaint Details</label>
                          <textarea
                            value={supportInput.description}
                            onChange={(e) => setSupportInput({ ...supportInput, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none h-24 resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* SEMANTIC SEARCH FORM */}
                    {activePillar === 'search' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Natural Language Query</label>
                          <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* ANALYTICS FORM */}
                    {activePillar === 'analytics' && (
                      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                        <p className="text-xs leading-relaxed font-medium">
                          No input required. Triggering this analysis fetches real-time store metrics, transaction velocity arrays, and multi-sig escrow status flags to generate growth projections.
                        </p>
                      </div>
                    )}

                    {/* FRAUD SCREENING FORM */}
                    {activePillar === 'fraud' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Content Body for Screening</label>
                          <textarea
                            value={riskInput.content}
                            onChange={(e) => setRiskInput({ ...riskInput, content: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none h-28 resize-none text-amber-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">User Trust Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={riskInput.userScore}
                            onChange={(e) => setRiskInput({ ...riskInput, userScore: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* TRANSLATION FORM */}
                    {activePillar === 'translation' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Original Message</label>
                          <textarea
                            value={translationInput.text}
                            onChange={(e) => setTranslationInput({ ...translationInput, text: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none h-20 resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Target Language</label>
                          <select
                            value={translationInput.targetLang}
                            onChange={(e) => setTranslationInput({ ...translationInput, targetLang: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          >
                            <option value="Spanish">Spanish</option>
                            <option value="Chinese">Chinese</option>
                            <option value="German">German</option>
                            <option value="Japanese">Japanese</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* AUTOMATION FORM */}
                    {activePillar === 'automation' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Title of New Post</label>
                          <input
                            type="text"
                            value={automationInput.title}
                            onChange={(e) => setAutomationInput({ ...automationInput, title: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Body Context</label>
                          <textarea
                            value={automationInput.content}
                            onChange={(e) => setAutomationInput({ ...automationInput, content: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none h-20 resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* RUN SIMULATOR BUTTON */}
                    <button
                      onClick={() => {
                        if (activePillar === 'assistant') runAssistant();
                        if (activePillar === 'studio') runStudio();
                        if (activePillar === 'support') runSupport();
                        if (activePillar === 'search') runSearch();
                        if (activePillar === 'analytics') runAnalytics();
                        if (activePillar === 'fraud') runRisk();
                        if (activePillar === 'translation') runTranslation();
                        if (activePillar === 'automation') runAutomation();
                      }}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Polling Abstract Router...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch AI Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* SANDBOX RESULT PANEL */}
                  <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-xs font-extrabold text-white tracking-tight font-mono uppercase">Output & Verification</h3>
                        </div>
                        {currentMetadata && (
                          <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            Confidence: {(currentMetadata.confidenceScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      {loading && (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3">
                          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs font-mono text-slate-400">Authenticating with provider endpoint...</p>
                        </div>
                      )}

                      {!loading && (
                        <div className="space-y-4 text-xs">
                          {/* INITIAL DRAFT WARNINGS */}
                          {!assistantOutput && !studioOutput && !supportOutput && !searchOutput && !analyticsOutput && !riskOutput && !translationOutput && !automationOutput && (
                            <div className="flex flex-col items-center justify-center h-48 text-center px-4 space-y-2">
                              <Bot className="w-10 h-10 text-slate-700 animate-pulse" />
                              <p className="text-slate-400 font-bold">Workspace Ready</p>
                              <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed font-medium">Modify sandbox parameters in the left panel and click "Dispatch AI Evaluation" to process with the active LLM pipeline.</p>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 1: ASSISTANT */}
                          {activePillar === 'assistant' && assistantOutput && (
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Profile Optimization Score</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full" style={{ width: `${assistantOutput.profileScore}%` }}></div>
                                  </div>
                                  <span className="font-mono font-extrabold text-slate-300 shrink-0">{assistantOutput.profileScore}%</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Name Advisory Analysis</p>
                                <p className="text-slate-300 leading-relaxed font-medium text-[11px]">{assistantOutput.storeNameAdvice}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Regional Pricing Vector</p>
                                <p className="text-slate-300 leading-relaxed font-medium text-[11px]">{assistantOutput.pricingStrategy}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Growth Roadmap Milestones</p>
                                <ul className="space-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                                  {assistantOutput.growthMilestones.map((m, i) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                      <span>{m}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 2: STUDIO */}
                          {activePillar === 'studio' && studioOutput && (
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">SEO Optimized Title</p>
                                <p className="text-white font-extrabold">{studioOutput.title}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Improved Description</p>
                                <p className="text-slate-300 leading-relaxed font-medium text-[11px] whitespace-pre-wrap">{studioOutput.description}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">SEO Meta Tags & Keywords</p>
                                <p className="text-slate-400 font-bold text-[11px]">Meta Title: <span className="text-slate-200">{studioOutput.seoMetadata.title}</span></p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {studioOutput.seoMetadata.keywords.map((k, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-[10px] font-mono text-indigo-300">{k}</span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Marketing Social Media Captions</p>
                                <div className="space-y-2 mt-1.5 text-[11px]">
                                  {studioOutput.socialCaptions.map((c, i) => (
                                    <p key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800/60 font-medium text-slate-300 italic">"{c}"</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 3: SUPPORT */}
                          {activePillar === 'support' && supportOutput && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 font-mono uppercase">Intent Detection</p>
                                  <p className="text-white font-extrabold">{supportOutput.intent}</p>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 font-mono uppercase">AI Customer Sentiment</p>
                                  <p className={`font-extrabold capitalize ${
                                    supportOutput.sentiment === 'positive' ? 'text-emerald-400' :
                                    supportOutput.sentiment === 'critical' ? 'text-rose-400' : 'text-slate-300'
                                  }`}>{supportOutput.sentiment}</p>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-rose-400 font-mono uppercase">Automation SLA Priority</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    supportOutput.autoPriority === 'sla_critical' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                                    supportOutput.autoPriority === 'high' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-950 text-slate-400'
                                  }`}>
                                    {supportOutput.autoPriority.replace('_', ' ')}
                                  </span>
                                  {supportOutput.escalationRecommended && (
                                    <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      Immediate Escalation Recommended
                                    </span>
                                  )}
                                </div>
                                {supportOutput.escalationReason && (
                                  <p className="text-[11px] text-rose-300/80 font-medium italic mt-1 leading-normal bg-rose-950/20 p-2 rounded border border-rose-950/30">
                                    {supportOutput.escalationReason}
                                  </p>
                                )}
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Suggested Auto-Replies</p>
                                <div className="space-y-2 mt-1.5 text-[11px]">
                                  {supportOutput.suggestedReplies.map((r, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-slate-950 p-2 rounded-lg border border-slate-800/60 font-medium text-slate-300">
                                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                      <span>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 4: SEARCH */}
                          {activePillar === 'search' && searchOutput && (
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Semantic Intent Interpretation</p>
                                <p className="text-white font-extrabold leading-normal text-[11px]">{searchOutput.interpretedIntent}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Vector Weight Allocation Breakdown</p>
                                <p className="text-slate-400 font-medium leading-relaxed text-[11px]">{searchOutput.relevanceExplanation}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Query Expansion (Keywords)</p>
                                <div className="flex flex-wrap gap-1">
                                  {searchOutput.expandedKeywords.map((k, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-indigo-300">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Related Dynamic Suggestions</p>
                                <div className="space-y-1 mt-1 text-[11px] text-slate-300 font-bold">
                                  {searchOutput.relatedSuggestions.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-md border border-slate-850">
                                      <Search className="w-3 h-3 text-indigo-400" />
                                      <span>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 5: ANALYTICS */}
                          {activePillar === 'analytics' && analyticsOutput && (
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-emerald-400 font-mono uppercase">Projected Core Growth Trajectory</p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-xl font-extrabold text-white">+{analyticsOutput.estimatedGrowthRatePercent}%</span>
                                  <span className="text-[10px] text-slate-500 font-medium">next 90 days</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Top Performers Reasoning</p>
                                <p className="text-slate-300 font-medium text-[11px] leading-relaxed">{analyticsOutput.topPerformersReasoning}</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Demand Forecast Matrix</p>
                                <div className="space-y-1.5 mt-1 text-[11px] font-mono">
                                  {analyticsOutput.demandForecast.map((d, i) => (
                                    <div key={i} className="flex justify-between p-1.5 bg-slate-950 rounded border border-slate-850">
                                      <span className="text-slate-300 font-extrabold">{d.month}</span>
                                      <span className="text-emerald-400 font-bold">{d.expectedSales} units <span className="text-slate-500">({d.confidenceInterval})</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Urgent Inventory Action Items</p>
                                <ul className="space-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                                  {analyticsOutput.inventoryActionItems.map((item, i) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 6: FRAUD */}
                          {activePillar === 'fraud' && riskOutput && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                                  <p className="text-[10px] font-bold text-slate-500 font-mono uppercase">Fraud Risk Score</p>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xl font-black font-mono ${
                                      riskOutput.riskScore > 70 ? 'text-rose-400' :
                                      riskOutput.riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>{riskOutput.riskScore}/100</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      riskOutput.verdict === 'high_risk_flag' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                      riskOutput.verdict === 'review_recommended' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>{riskOutput.verdict.replace('_', ' ')}</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 font-mono uppercase">Bot Activity Prob.</p>
                                  <p className="text-base font-extrabold font-mono text-white">{(riskOutput.botActivityProbability * 100).toFixed(0)}%</p>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-rose-400 font-mono uppercase">Active Risk Flags Raised</p>
                                <div className="space-y-1 mt-1 text-[11px] font-mono">
                                  <div className="flex justify-between p-1 bg-slate-950 rounded">
                                    <span className="text-slate-400">Spam Pattern Matched:</span>
                                    <span className={riskOutput.isSpamDetected ? 'text-rose-400 font-bold' : 'text-slate-500'}>{riskOutput.isSpamDetected ? 'YES' : 'NO'}</span>
                                  </div>
                                  <div className="flex justify-between p-1 bg-slate-950 rounded">
                                    <span className="text-slate-400">Duplicate Product Listing:</span>
                                    <span className={riskOutput.isDuplicateDetected ? 'text-rose-400 font-bold' : 'text-slate-500'}>{riskOutput.isDuplicateDetected ? 'YES' : 'NO'}</span>
                                  </div>
                                  <div className="flex justify-between p-1 bg-slate-950 rounded">
                                    <span className="text-slate-400">Suspicious Escrow Release:</span>
                                    <span className={riskOutput.isSuspiciousPaymentPattern ? 'text-rose-400 font-bold' : 'text-slate-500'}>{riskOutput.isSuspiciousPaymentPattern ? 'YES' : 'NO'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Risk Mitigation Checklist</p>
                                <ul className="space-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                                  {riskOutput.reasons.map((r, i) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* OUTPUT PILLAR 7: TRANSLATION */}
                          {activePillar === 'translation' && translationOutput && (
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Detected Source Language</p>
                                <p className="text-white font-extrabold">{translationOutput.detectedLanguage} (100% confidence)</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Translated Text Output</p>
                                <p className="text-white leading-relaxed font-bold bg-slate-950 p-3 rounded-lg border border-slate-850 text-[11px] italic">
                                  "{translationOutput.translatedText}"
                                </p>
                              </div>

                              {translationOutput.voiceSynthesisAvailable && (
                                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
                                    <p className="text-[10px] text-slate-400 font-medium">Text-to-Speech audio payload compiled successfully.</p>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">24kHz PCM</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* OUTPUT PILLAR 8: AUTOMATION */}
                          {activePillar === 'automation' && automationOutput && (
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                                <p className="text-[10px] font-bold text-indigo-400 font-mono uppercase">Auto-Categorization Analysis</p>
                                <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-850">
                                  <span className="text-slate-400 font-medium">Assigned Category:</span>
                                  <span className="text-indigo-400 font-extrabold">{automationOutput.autoCategory}</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1.5">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Auto-Tag Allocation</p>
                                <div className="flex flex-wrap gap-1">
                                  {automationOutput.autoTags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-indigo-300">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">SLA Processing Target</p>
                                <p className="text-white font-extrabold text-[11px]">{automationOutput.slaTargetHours} Hour Guaranteed Review Window</p>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                                <p className="text-[10px] font-bold text-violet-400 font-mono uppercase">Suggested Next Steps</p>
                                <ul className="space-y-1 mt-1 text-[11px] text-slate-400 font-medium">
                                  {automationOutput.suggestedNextSteps.map((s, i) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SANDBOX GOVERNANCE FOOTER RECORD */}
                    {currentMetadata && !loading && (
                      <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-2 text-[10px] font-mono text-slate-500">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>Model: <span className="text-slate-300 font-extrabold">{currentMetadata.modelVersion}</span></span>
                          <span>Prompt Version: <span className="text-slate-300 font-extrabold">{currentMetadata.promptVersion}</span></span>
                        </div>
                        <div className="flex justify-between gap-2 text-slate-500">
                          <span className="truncate max-w-[200px] sm:max-w-xs">Audit Hash: <span className="text-indigo-400 font-bold">{currentMetadata.auditHash.substring(0, 16)}...</span></span>
                          <span>Latency: <span className="text-slate-300 font-bold">{currentMetadata.latencyMs}ms</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROVIDER ABSTRACTION */}
          {activeTab === 'providers' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Active LLM Providers</h2>
                <p className="text-slate-400 text-xs font-medium">Toggle or adjust hyperparameters on any of the five enterprise pipelines.</p>
              </div>

              <div className="space-y-4">
                {providersList.map((p) => (
                  <div key={p.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white ${p.enabled ? 'bg-indigo-600/10 text-indigo-400' : 'bg-slate-900 text-slate-600'}`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white">{p.name}</h3>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">{p.modelName} • {p.modelVersion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          p.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {p.enabled ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => handleToggleProvider(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            p.enabled
                              ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'
                          }`}
                        >
                          {p.enabled ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    {p.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-900 font-mono text-[10px]">
                        <div className="space-y-1">
                          <span className="text-slate-500 uppercase font-bold tracking-wider">Temperature</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={p.temperature}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                aiPlatform.updateProviderConfig(p.id, { temperature: val });
                                setProvidersList(aiPlatform.getProviders());
                              }}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-slate-300 font-extrabold">{p.temperature.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 uppercase font-bold tracking-wider">Max Gen Tokens</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={p.maxTokens}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                aiPlatform.updateProviderConfig(p.id, { maxTokens: val });
                                setProvidersList(aiPlatform.getProviders());
                              }}
                              className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded p-1 outline-none font-bold"
                            >
                              <option value="1024">1,024</option>
                              <option value="2048">2,048</option>
                              <option value="4096">4,096</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 uppercase font-bold tracking-wider">Prompt Routing v.</span>
                          <p className="text-slate-300 font-bold mt-1">{p.promptVersion}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 uppercase font-bold tracking-wider">Cost / 1K Tokens</span>
                          <p className="text-slate-300 font-extrabold mt-1 text-indigo-400">{p.costPerThousandTokens.toFixed(4)} Pi</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY LEDGER */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Governance Audit Ledger</h2>
                  <p className="text-slate-400 text-xs font-medium">Cryptographically aligned transaction records logging every LLM generation.</p>
                </div>
                <button
                  onClick={() => {
                    setAuditLogs(aiPlatform.getAuditLogs());
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-all self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Ledger</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold uppercase tracking-wider">
                          {log.pillar.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 font-bold">{log.timestamp}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">ID: <span className="text-slate-300">{log.id}</span></span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">PROVIDER</span>
                        <span className="text-slate-200 font-extrabold uppercase">{log.providerId} ({log.modelVersion})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">PROMPT VERSION</span>
                        <span className="text-slate-200 font-bold">{log.promptVersion}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">LATENCY</span>
                        <span className="text-emerald-400 font-extrabold">{log.latencyMs} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ESTIMATED COST</span>
                        <span className="text-amber-400 font-extrabold">{log.estimatedCostPi.toFixed(6)} Pi</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Prompt Input Preview</span>
                        <p className="text-slate-300 font-medium truncate italic mt-0.5">"{log.promptInputSnippet}"</p>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 text-[9px] uppercase tracking-wider block">AI Generated Completion</span>
                        <p className="text-slate-300 font-bold truncate mt-0.5">{log.responseSnippet}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 bg-indigo-950/20 px-3 py-1 rounded-lg border border-indigo-950/30">
                      <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Ledger Checksum Hash: <span className="text-slate-300">{log.auditHash}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & ISOLATION */}
          {activeTab === 'security' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">AI Security Engine & Isolation</h2>
                <p className="text-slate-400 text-xs font-medium">Protecting Pioneer nodes, tenant boundaries, and preventing prompt injections.</p>
              </div>

              {/* SECURITY SHIELDS CONFIGURATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-violet-400" />
                      <h3 className="text-xs font-extrabold text-white">Prompt Injection Shield</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Audits user prompt structures before pipeline routing. Suspends execution if financial injection parameters are triggered.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDefenses({ ...activeDefenses, promptInjection: !activeDefenses.promptInjection })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      activeDefenses.promptInjection ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {activeDefenses.promptInjection ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-extrabold text-white">Sensitive Data Masking</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Intercepts and filters raw wallet private keys, passwords, and sensitive KYC coordinates from being leaked to LLMs.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDefenses({ ...activeDefenses, dataLeakage: !activeDefenses.dataLeakage })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      activeDefenses.dataLeakage ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {activeDefenses.dataLeakage ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-extrabold text-white">Cross-Tenant Isolation</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Maintains strict logical context boundaries. Guarantees that Pioneer merchant analytics are never mixed with buyer pipelines.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDefenses({ ...activeDefenses, crossTenantIsolation: !activeDefenses.crossTenantIsolation })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      activeDefenses.crossTenantIsolation ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {activeDefenses.crossTenantIsolation ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-extrabold text-white">Unsafe Content filter</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Examines generated completions in real-time. Immediately flags illegal financial advice, mock tokens, or off-chain scam solicitations.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDefenses({ ...activeDefenses, unsafeContentFilter: !activeDefenses.unsafeContentFilter })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      activeDefenses.unsafeContentFilter ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {activeDefenses.unsafeContentFilter ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* THREAT REPORT BOX */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-400 w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase font-mono">Mainnet Security Audit Passed</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Penetration testing and guardrails fully aligned with standard KYC parameters.</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-850 text-xs space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-200">How our security isolation model functions:</p>
                  <p className="text-slate-400 text-[11px] font-medium">
                    1. **Prompt Sanitization:** All inbound queries are regexed for code snippet escapes. Private wallet variables are masked at input point.
                  </p>
                  <p className="text-slate-400 text-[11px] font-medium">
                    2. **Context Enclosure:** We explicitly append "pioneer_context" structures to each pipeline call. This seals tenant queries inside an isolated thread, preventing leaks.
                  </p>
                  <p className="text-slate-400 text-[11px] font-medium">
                    3. **Completion Decoupling:** Generated outputs are parsed for safety markers prior to final rendering in the browser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
