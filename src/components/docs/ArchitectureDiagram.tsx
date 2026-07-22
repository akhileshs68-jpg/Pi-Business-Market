/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  Globe, 
  Server, 
  Database, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw,
  Zap,
  Layers,
  ArrowDown
} from 'lucide-react';

interface ArchitectureDiagramProps {
  language: 'en' | 'hi' | 'dual';
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ language }) => {
  const [activeNode, setActiveNode] = useState<string | null>('escrow');

  const nodes = [
    {
      id: 'client',
      titleEn: '1. Client Presentation Layer',
      titleHi: '1. क्लाइंट प्रेजेंटेशन लेयर',
      tech: 'React + Vite + Tailwind CSS + Pi Browser SDK',
      icon: Smartphone,
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-sky-950/40 border-sky-500/30',
      textColor: 'text-sky-400',
      descEn: 'Runs on mobile Pi Browser or Web Browser. Handles UI rendering, wallet authorization triggers, and local state caching.',
      descHi: 'मोबाइल Pi Browser या वेब ब्राउज़र में चलता है। UI रेंडरिंग, वॉलेट ऑथेंटिकेशन और लोकली स्टेट मैनेजमेंट को संभालता है।'
    },
    {
      id: 'gateway',
      titleEn: '2. Express.js API Gateway',
      titleHi: '2. एक्सप्रेस API गेटवे',
      tech: 'Node.js Express Server (Port 3000 / Cloud Run)',
      icon: Server,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-950/40 border-indigo-500/30',
      textColor: 'text-indigo-400',
      descEn: 'Proxies API calls (/api/auth/pi, /api/escrow, /api/inventory), validates Pi backend tokens, sanitizes payload inputs.',
      descHi: 'API कॉल्स को प्रॉक्सी करता है, Pi एक्सेस टोकन सत्यापित करता है और इनपुट डेटा को सुरक्षित रखता है।'
    },
    {
      id: 'database',
      titleEn: '3. Realtime Firestore Database',
      titleHi: '3. फिएरस्टोर डेटाबेस इंजन',
      tech: 'Firebase Firestore Multi-Region Cloud Store',
      icon: Database,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-950/40 border-amber-500/30',
      textColor: 'text-amber-400',
      descEn: 'Stores user profiles, products, orders, warehouse stock, CRM profiles, and audit logs with granular security rules.',
      descHi: 'यूजर्स प्रोफाइल, कैटलॉग, ऑर्डर स्टेट्स, वेयरहाउस स्टॉक और ऑडिट लॉग्स को सुरक्षित रखता है।'
    },
    {
      id: 'escrow',
      titleEn: '4. Web3 Pi Smart Escrow Vault',
      titleHi: '4. Web3 Pi स्मार्ट एस्क्रौ वॉल्ट',
      tech: 'Cryptographic Non-Custodial Smart Contract Engine',
      icon: Lock,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-950/40 border-emerald-500/30',
      textColor: 'text-emerald-400',
      descEn: 'Locks buyer Pi tokens during checkout. Releases funds to merchant wallet automatically upon verified order delivery.',
      descHi: 'चेकआउट पर Pi टोकन लॉक करता है। ऑर्डर डिलीवरी होने की पुष्टि पर तुरंत मर्चेंट वॉलेट में फंड जारी करता है।'
    }
  ];

  return (
    <div className="my-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 backdrop-blur-sm">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
            Interactive High-Level Diagram
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            {language === 'hi' ? 'Pi Business Market आर्किटेक्चर ब्लॉक' : 'Pi Business Market System Architecture'}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Status: Production Containerized</span>
        </div>
      </div>

      {/* DIAGRAM FLOW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const isSelected = activeNode === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(node.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                isSelected
                  ? `${node.bgColor} shadow-lg ring-2 ring-indigo-500/40 scale-[1.02]`
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-tr ${node.color} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                  Node 0{index + 1}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mb-1">
                {language === 'hi' ? node.titleHi : node.titleEn}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mb-2 truncate">
                {node.tech}
              </p>
              
              {/* Active Arrow indicator */}
              {index < nodes.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SELECTED NODE DETAILS VIEW */}
      {activeNode && (
        <div className="p-4 bg-slate-950/80 rounded-xl border border-indigo-500/20 text-slate-300 text-xs leading-relaxed animate-fadeIn">
          {(() => {
            const current = nodes.find(n => n.id === activeNode);
            if (!current) return null;
            return (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${current.textColor}`}>
                      {language === 'hi' ? current.titleHi : current.titleEn}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {current.tech}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {language === 'hi' || language === 'dual' ? current.descHi : current.descEn}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveNode(null)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono shrink-0"
                >
                  Close Details
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ARCHITECTURE DATA FLOW FOOTER */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Zero-Trust API Proxies & Non-Custodial Wallet Authentication</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>99.99% Uptime Containerized Deployment</span>
        </div>
      </div>
    </div>
  );
};
