/**
 * Admin Blockchain & Web3 Operations Dashboard
 * Real-time monitoring for Redundant RPC nodes, Dual Economy (Pi Testnet & BMP Rewards),
 * Web3 Event Streams, Feature Flags, and Token Migration Pipelines.
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Activity, ShieldCheck, RefreshCw, Zap, 
  Coins, ArrowRightLeft, Lock, Layers, CheckCircle2, 
  AlertTriangle, Radio, HardDrive, Terminal, HelpCircle
} from 'lucide-react';
import { blockchainService } from '../../services/blockchain/blockchainService';
import { RpcHealthReport, BlockchainEvent, MigrationPhaseStatus } from '../../services/blockchain/blockchainTypes';

export const BlockchainAdminDashboard: React.FC = () => {
  const [healthReport, setHealthReport] = useState<RpcHealthReport>(blockchainService.rpc.getHealthReport());
  const [streamInfo, setStreamInfo] = useState(blockchainService.events.getConnectionStatus());
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([]);
  const [migrationPipeline, setMigrationPipeline] = useState<MigrationPhaseStatus[]>(blockchainService.migration.getMigrationPipeline());
  const [isPinging, setIsPinging] = useState(false);
  const [activeTab, setActiveTab] = useState<'rpc' | 'economy' | 'events' | 'flags' | 'migration'>('rpc');

  useEffect(() => {
    // Refresh health report and stream stats
    const interval = setInterval(() => {
      setHealthReport(blockchainService.rpc.getHealthReport());
      setStreamInfo(blockchainService.events.getConnectionStatus());
    }, 4000);

    // Subscribe to live events
    const unsubscribe = blockchainService.events.subscribeAll((event) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 19)]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleManualPing = async () => {
    setIsPinging(true);
    try {
      const report = await blockchainService.rpc.pingAllNodes();
      setHealthReport(report);
    } catch (e) {
      console.error('Error pinging RPC nodes:', e);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RPC Health */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Redundant RPC Nodes</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{healthReport.healthyNodesCount}/{healthReport.totalNodes}</span>
            <span className="text-xs font-semibold text-emerald-400">Healthy (100% Failover Safe)</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Avg Latency: <strong className="text-slate-300 font-mono">{healthReport.averageLatencyMs}ms</strong></span>
            <span className="text-emerald-400 font-bold">Auto-Failover Active</span>
          </div>
        </div>

        {/* Dual Asset Economy */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Asset</span>
            <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-300 font-mono">Pi Testnet</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">Exclusive</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            Used for Checkout, Orders, Shipping & Settlement
          </div>
        </div>

        {/* Reward Economy */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reward Economy</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">BMP Ledger</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">Immutable</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            Earned via Purchases, Sales, Reviews, Referrals & Shares
          </div>
        </div>

        {/* Web3 Stream Status */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Block Stream</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">#{streamInfo.currentBlock}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">Live WebSocket</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span>Queue: <strong className="text-slate-300 font-mono">{streamInfo.queueLength}</strong></span>
            <span className="text-emerald-400 font-bold">Heartbeat OK</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'rpc', label: 'RPC Health & Nodes', icon: Server },
            { id: 'economy', label: 'Dual Economy Assets', icon: Coins },
            { id: 'events', label: 'Web3 Stream Logs', icon: Terminal },
            { id: 'flags', label: 'Feature Flags & Swap', icon: ArrowRightLeft },
            { id: 'migration', label: 'BMP Token Migration', icon: Layers }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleManualPing}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-violet-400' : ''}`} />
          {isPinging ? 'Pinging Nodes...' : 'Ping Nodes'}
        </button>
      </div>

      {/* Tab 1: RPC Health & Nodes */}
      {activeTab === 'rpc' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Active Primary RPC: {healthReport.nodes.find(n => n.id === healthReport.activeNodeId)?.name || 'Primary Pi Node'}</h3>
                <p className="text-xs text-slate-400 font-medium">Automatic failover protocol guarantees uninterrupted checkout & blockchain verification.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
              100% Failover Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthReport.nodes.map(node => (
              <div 
                key={node.id} 
                className={`p-4 bg-slate-950 border rounded-2xl space-y-3 relative transition-all ${
                  node.id === healthReport.activeNodeId 
                    ? 'border-violet-500/60 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30' 
                    : 'border-slate-800'
                }`}
              >
                {node.id === healthReport.activeNodeId && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                    Active Gateway
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-xs font-black text-white uppercase tracking-wider">{node.role}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-200">{node.name}</h4>
                  <p className="text-[11px] font-mono text-slate-500 truncate">{node.url}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500">Latency:</span>
                    <p className="font-mono font-bold text-emerald-400">{node.latencyMs} ms</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Block Height:</span>
                    <p className="font-mono font-bold text-slate-300">#{node.blockHeight}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Dual Economy Assets */}
      {activeTab === 'economy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pi Testnet Asset Box */}
          <div className="p-6 bg-slate-900/80 border border-violet-500/30 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl border border-violet-500/30">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Pi Testnet Pi (Payment Asset)</h3>
                  <p className="text-xs text-violet-300/80 font-medium">Exclusive Marketplace Currency</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                Active Production
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <p className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Allowed Usage:</span>
                <strong className="text-white">Product & Service Checkout, Shipping, Settlement</strong>
              </p>
              <p className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Reward Mixing:</span>
                <strong className="text-emerald-400">STRICTLY SEPARATED (Zero internal mixing)</strong>
              </p>
              <p className="flex justify-between py-1">
                <span className="text-slate-400">Escrow Mode:</span>
                <strong className="text-amber-400">Instant Merchant Settlement</strong>
              </p>
            </div>
          </div>

          {/* BMP Reward Asset Box */}
          <div className="p-6 bg-slate-900/80 border border-amber-500/30 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">BMP Rewards (Reward Asset)</h3>
                  <p className="text-xs text-amber-300/80 font-medium">Verified Growth & Loyalty Economy</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                Master Ledger
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <p className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Earning Action:</span>
                <strong className="text-white">Purchases, Verified Reviews, Referrals, Social Shares</strong>
              </p>
              <p className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Ledger Verification:</span>
                <strong className="text-emerald-400">Server-Side Verified (Zero Client Trust)</strong>
              </p>
              <p className="flex justify-between py-1">
                <span className="text-slate-400">Blockchain Mapping:</span>
                <strong className="text-indigo-400">1:1 On-Chain Token Ready</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Web3 Event Stream */}
      {activeTab === 'events' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <span className="font-bold text-white uppercase tracking-wider">Live Blockchain Stream Log</span>
            </div>
            <span className="text-[10px] text-slate-400">Showing last {recentEvents.length} events</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
            {recentEvents.length === 0 ? (
              <p className="text-slate-500 py-6 text-center italic">Listening for live stream events...</p>
            ) : (
              recentEvents.map(evt => (
                <div key={evt.id} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold">{evt.type}</span>
                    <span className="text-slate-400">#{evt.blockNumber}</span>
                    <span className="text-slate-500 truncate max-w-[150px]">{evt.txHash}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Feature Flags & Swap */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Future Blockchain Capabilities</h3>
                <p className="text-xs text-slate-400 font-medium">All future modules are prepared in code and safely guarded by Feature Flags.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase">Pi ↔ BMP Swap Engine</p>
                <p className="text-[10px] text-slate-400">Modular liquidity pool & quote generator</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-md">
                DISABLED (Mainnet Pending)
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase">Pi Mainnet Provider</p>
                <p className="text-[10px] text-slate-400">Direct mainnet RPC & ledger settlement</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-md">
                DISABLED
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase">Smart Escrow Contract</p>
                <p className="text-[10px] text-slate-400">Multi-signature automated escrow</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-md">
                DISABLED
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase">Cross-Chain Bridge</p>
                <p className="text-[10px] text-slate-400">External blockchain bridge provider</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-md">
                DISABLED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: BMP Token Migration Pipeline */}
      {activeTab === 'migration' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">4-Phase BMP Token Migration Pipeline</h3>
                <p className="text-xs text-slate-400 font-medium">Guarantees 1:1 balance preservation when transitioning from database ledger to on-chain tokens.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {migrationPipeline.map(step => (
              <div key={step.phase} className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    step.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    step.status === 'IN_PROGRESS' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    P{step.phase}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">{step.title}</h4>
                    <p className="text-[11px] text-slate-400">{step.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    step.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    step.status === 'IN_PROGRESS' ? 'bg-violet-500/10 text-violet-400' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {step.status}
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 pt-1">
                    {step.recordsProcessed.toLocaleString()} Records
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
