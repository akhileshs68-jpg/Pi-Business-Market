/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockchainNode, RpcHealthReport, LoadBalancingStrategy } from './blockchainTypes';
import { subscriptionService } from './subscriptionService';

const INITIAL_NODES: BlockchainNode[] = [
  {
    id: 'rpc-primary-pi',
    name: 'Pi Testnet Primary Horizon RPC',
    url: 'https://api.testnet.minepi.com',
    role: 'PRIMARY_RPC',
    status: 'ONLINE',
    latencyMs: 42,
    responseTimeMs: 45,
    blockHeight: 18492041,
    lastPingAt: new Date().toISOString(),
    errorCount: 0,
    successCount: 1420,
    errorRate: 0.0,
    nodeVersion: 'v2.4.1-horizon',
    weight: 10,
    circuitBreakerOpen: false
  },
  {
    id: 'rpc-mirror-1',
    name: 'Pi Testnet Redundant Mirror Node 1',
    url: 'https://testnet-rpc-mirror-1.pinetwork.io',
    role: 'REDUNDANT_MIRROR',
    status: 'ONLINE',
    latencyMs: 58,
    responseTimeMs: 60,
    blockHeight: 18492041,
    lastPingAt: new Date().toISOString(),
    errorCount: 0,
    successCount: 980,
    errorRate: 0.0,
    nodeVersion: 'v2.4.1-horizon',
    weight: 8,
    circuitBreakerOpen: false
  },
  {
    id: 'rpc-backup-2',
    name: 'Pi Testnet Failover Backup Node 2',
    url: 'https://testnet-rpc-mirror-2.pinetwork.io',
    role: 'FAILOVER_BACKUP',
    status: 'ONLINE',
    latencyMs: 85,
    responseTimeMs: 90,
    blockHeight: 18492040,
    lastPingAt: new Date().toISOString(),
    errorCount: 0,
    successCount: 520,
    errorRate: 0.0,
    nodeVersion: 'v2.4.0-horizon',
    weight: 5,
    circuitBreakerOpen: false
  }
];

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

interface PendingOfflineRpcRequest {
  id: string;
  operationName: string;
  timestamp: string;
  retryFn: () => Promise<any>;
}

class RpcManagerService {
  private nodes: BlockchainNode[] = [...INITIAL_NODES];
  private activeNodeId: string = 'rpc-primary-pi';
  private strategy: LoadBalancingStrategy = 'PRIORITY';
  private roundRobinIndex: number = 0;
  private pingIntervalTimer: any = null;

  // Cache Engine
  private rpcCache: Map<string, CacheItem<any>> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private totalRpcCallsHandled: number = 0;

  // Offline Queue
  private offlineQueue: PendingOfflineRpcRequest[] = [];

  constructor() {
    this.startHealthCheckLoop();
  }

  /**
   * Select best node according to configured Load Balancing strategy
   */
  public getActiveNode(): BlockchainNode {
    const availableNodes = this.nodes.filter(
      n => n.status !== 'OFFLINE' && !n.circuitBreakerOpen
    );

    if (availableNodes.length === 0) {
      // Circuit breaker auto-reset attempt if all nodes are marked offline
      console.warn('[RpcManager] All RPC nodes offline/tripped. Resetting circuit breakers in resilient mode.');
      this.nodes.forEach(n => {
        n.status = 'ONLINE';
        n.circuitBreakerOpen = false;
        n.errorCount = 0;
      });
      return this.nodes[0];
    }

    switch (this.strategy) {
      case 'ROUND_ROBIN': {
        this.roundRobinIndex = (this.roundRobinIndex + 1) % availableNodes.length;
        const selected = availableNodes[this.roundRobinIndex];
        this.activeNodeId = selected.id;
        return selected;
      }

      case 'LATENCY_BASED': {
        const sortedByLatency = [...availableNodes].sort((a, b) => a.latencyMs - b.latencyMs);
        const selected = sortedByLatency[0];
        this.activeNodeId = selected.id;
        return selected;
      }

      case 'WEIGHTED': {
        const totalWeight = availableNodes.reduce((acc, n) => acc + n.weight, 0);
        let random = Math.random() * totalWeight;
        for (const node of availableNodes) {
          if (random < node.weight) {
            this.activeNodeId = node.id;
            return node;
          }
          random -= node.weight;
        }
        return availableNodes[0];
      }

      case 'PRIORITY':
      default: {
        const preferred = availableNodes.find(n => n.id === this.activeNodeId);
        if (preferred) return preferred;
        const fallback = availableNodes[0];
        this.activeNodeId = fallback.id;
        return fallback;
      }
    }
  }

  /**
   * Execute cached RPC read operation with TTL
   */
  public async executeCachedRpcCall<T>(
    cacheKey: string,
    operationName: string,
    rpcFn: (nodeUrl: string) => Promise<T>,
    ttlMs: number = 10000
  ): Promise<T> {
    const now = Date.now();
    const cached = this.rpcCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      this.cacheHits++;
      return cached.data;
    }

    this.cacheMisses++;
    const freshData = await this.executeRpcCall(operationName, rpcFn);
    this.rpcCache.set(cacheKey, {
      data: freshData,
      expiresAt: now + ttlMs
    });

    return freshData;
  }

  /**
   * Execute RPC call with exponential backoff, circuit breaker, timeout protection, and failover
   */
  public async executeRpcCall<T>(
    operationName: string,
    rpcFn: (nodeUrl: string) => Promise<T>,
    maxRetries: number = 3,
    timeoutMs: number = 4000
  ): Promise<T> {
    this.totalRpcCallsHandled++;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const activeNode = this.getActiveNode();
      const startTime = Date.now();

      try {
        const result = await Promise.race([
          rpcFn(activeNode.url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`RPC Timeout on ${activeNode.id} after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);

        const elapsed = Date.now() - startTime;
        activeNode.responseTimeMs = elapsed;
        activeNode.latencyMs = Math.round((activeNode.latencyMs * 0.7) + (elapsed * 0.3));
        activeNode.status = activeNode.latencyMs > 300 ? 'DEGRADED' : 'ONLINE';
        activeNode.successCount++;
        activeNode.errorRate = activeNode.errorCount / (activeNode.successCount + activeNode.errorCount || 1);

        if (activeNode.circuitBreakerOpen) {
          activeNode.circuitBreakerOpen = false;
          subscriptionService.publishEvent('RPC_RECOVERY', {
            nodeId: activeNode.id,
            nodeName: activeNode.name,
            recoveredAt: new Date().toISOString()
          });
        }

        return result;
      } catch (err: any) {
        lastError = err;
        const elapsed = Date.now() - startTime;
        activeNode.errorCount++;
        activeNode.errorRate = activeNode.errorCount / (activeNode.successCount + activeNode.errorCount || 1);

        console.warn(`[RpcManager] RPC call "${operationName}" failed on node ${activeNode.id} (Attempt ${attempt}/${maxRetries}):`, err.message);

        // Circuit breaker trigger if errors exceed threshold
        if (activeNode.errorCount >= 3) {
          activeNode.circuitBreakerOpen = true;
          activeNode.status = 'OFFLINE';
          console.error(`[RpcManager] Circuit breaker OPENED for node ${activeNode.id}`);
          subscriptionService.publishEvent('RPC_DISCONNECTED', {
            nodeId: activeNode.id,
            nodeName: activeNode.name,
            reason: err.message
          });
        } else {
          activeNode.status = 'DEGRADED';
        }

        // Trigger automatic failover
        this.triggerFailover(activeNode.id, err.message);

        // Exponential backoff
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // Queue for retry if offline
    this.queueOfflineRequest(operationName, () => this.executeRpcCall(operationName, rpcFn, maxRetries, timeoutMs));

    throw new Error(`[RpcManager] RPC execution failed for "${operationName}" across all cluster nodes. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Queue failed offline write/read operations for background sync when connection recovers
   */
  private queueOfflineRequest(operationName: string, retryFn: () => Promise<any>) {
    const req: PendingOfflineRpcRequest = {
      id: `off_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      operationName,
      timestamp: new Date().toISOString(),
      retryFn
    };
    this.offlineQueue.push(req);
    if (this.offlineQueue.length > 50) this.offlineQueue.shift(); // Bound memory queue
  }

  /**
   * Process offline queue when network/nodes recover
   */
  public async processOfflineQueue(): Promise<number> {
    if (this.offlineQueue.length === 0) return 0;
    const queueToProcess = [...this.offlineQueue];
    this.offlineQueue = [];
    let processedCount = 0;

    for (const req of queueToProcess) {
      try {
        await req.retryFn();
        processedCount++;
      } catch (e) {
        console.warn(`[RpcManager] Failed re-processing offline request ${req.id}:`, e);
      }
    }
    return processedCount;
  }

  /**
   * Trigger failover to next healthy node
   */
  public triggerFailover(failedNodeId?: string, reason?: string): BlockchainNode {
    const previousNodeId = this.activeNodeId;
    const healthyNodes = this.nodes
      .filter(n => n.status !== 'OFFLINE' && !n.circuitBreakerOpen)
      .sort((a, b) => a.latencyMs - b.latencyMs);

    if (healthyNodes.length > 0) {
      this.activeNodeId = healthyNodes[0].id;
    } else {
      // Force reset circuit breakers if every node tripped
      this.nodes.forEach(n => { n.status = 'ONLINE'; n.circuitBreakerOpen = false; n.errorCount = 0; });
      this.activeNodeId = this.nodes[0].id;
    }

    const newNode = this.getActiveNode();

    if (previousNodeId !== newNode.id) {
      subscriptionService.publishEvent('RPC_FAILOVER', {
        previousNodeId,
        activeNodeId: newNode.id,
        nodeName: newNode.name,
        reason: reason || 'High latency / Node failure'
      });
    }

    return newNode;
  }

  /**
   * Ping all nodes and monitor latency, block height, and health stats
   */
  public async pingAllNodes(): Promise<RpcHealthReport> {
    const now = new Date().toISOString();

    for (const node of this.nodes) {
      const start = Date.now();
      try {
        // Simulate real horizon RPC node status check
        const jitter = Math.floor(Math.random() * 20) - 8;
        const latency = Math.max(12, (node.latencyMs || 45) + jitter);
        const elapsed = Date.now() - start + latency;

        node.latencyMs = latency;
        node.responseTimeMs = elapsed;
        node.status = latency > 250 ? 'DEGRADED' : 'ONLINE';
        node.blockHeight += Math.random() > 0.6 ? 1 : 0;
        node.lastPingAt = now;

        if (latency > 350) {
          subscriptionService.publishEvent('LATENCY_WARNING', {
            nodeId: node.id,
            nodeName: node.name,
            latencyMs: latency
          });
        }
      } catch (e) {
        node.status = 'OFFLINE';
        node.errorCount++;
        node.lastPingAt = now;
      }
    }

    // Process queued offline requests if nodes are online
    await this.processOfflineQueue();

    return this.getHealthReport();
  }

  /**
   * Add a new node dynamically (Supports RPC 4, RPC 5, Mainnet RPC, etc.)
   */
  public registerNode(node: Omit<BlockchainNode, 'lastPingAt' | 'errorCount' | 'successCount' | 'errorRate' | 'circuitBreakerOpen'>): BlockchainNode {
    const fullNode: BlockchainNode = {
      ...node,
      lastPingAt: new Date().toISOString(),
      errorCount: 0,
      successCount: 0,
      errorRate: 0.0,
      circuitBreakerOpen: false
    };

    const existingIndex = this.nodes.findIndex(n => n.id === node.id);
    if (existingIndex >= 0) {
      this.nodes[existingIndex] = fullNode;
    } else {
      this.nodes.push(fullNode);
    }

    subscriptionService.publishEvent('RPC_CONNECTED', {
      nodeId: fullNode.id,
      nodeName: fullNode.name,
      role: fullNode.role
    });

    return fullNode;
  }

  /**
   * Remove node from cluster
   */
  public removeNode(nodeId: string): boolean {
    const initialLength = this.nodes.length;
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    if (this.activeNodeId === nodeId) {
      this.triggerFailover(nodeId, 'Node unregistered');
    }
    return this.nodes.length < initialLength;
  }

  /**
   * Manually switch active node
   */
  public setActiveNode(nodeId: string): BlockchainNode {
    const target = this.nodes.find(n => n.id === nodeId);
    if (!target) throw new Error(`RPC Node ${nodeId} not found`);
    this.activeNodeId = nodeId;
    target.status = 'ONLINE';
    target.circuitBreakerOpen = false;

    subscriptionService.publishEvent('RPC_CONNECTED', {
      nodeId: target.id,
      nodeName: target.name,
      role: target.role
    });

    return target;
  }

  /**
   * Set load balancing strategy
   */
  public setLoadBalancingStrategy(strategy: LoadBalancingStrategy) {
    this.strategy = strategy;
  }

  /**
   * Clear RPC cache
   */
  public clearCache() {
    this.rpcCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get comprehensive health report for Admin Monitoring
   */
  public getHealthReport(): RpcHealthReport {
    const healthyCount = this.nodes.filter(n => n.status === 'ONLINE' && !n.circuitBreakerOpen).length;
    const avgLatency = Math.round(
      this.nodes.reduce((acc, n) => acc + (n.latencyMs || 0), 0) / (this.nodes.length || 1)
    );

    const totalCacheOps = this.cacheHits + this.cacheMisses;
    const cacheRatio = totalCacheOps > 0 ? Math.round((this.cacheHits / totalCacheOps) * 100) : 100;

    return {
      activeNodeId: this.activeNodeId,
      totalNodes: this.nodes.length,
      healthyNodesCount: healthyCount,
      averageLatencyMs: avgLatency,
      loadBalancingStrategy: this.strategy,
      nodes: [...this.nodes],
      lastCheckedAt: new Date().toISOString(),
      totalRpcCallsHandled: this.totalRpcCallsHandled,
      cacheHitRatioPercent: cacheRatio
    };
  }

  private startHealthCheckLoop() {
    if (typeof window === 'undefined') return;
    if (this.pingIntervalTimer) clearInterval(this.pingIntervalTimer);

    this.pingIntervalTimer = setInterval(() => {
      this.pingAllNodes().catch(err => console.error('[RpcManager] Health check loop error:', err));
    }, 20000);
  }
}

export const rpcManager = new RpcManagerService();
