/**
 * Pi Business Market - Enterprise Web3 & Blockchain Architecture Types
 * Dual Economy Assets:
 * 1. Pi Testnet Pi: Exclusive payment asset for purchases, orders, checkout, shipping, merchant settlement, escrow, refunds.
 * 2. BMP Reward Points / Token: Reward asset earned via verified marketplace actions (sales, purchases, reviews, shares, daily check-in).
 */

export type AssetType = 'PI_TESTNET' | 'BMP_REWARD' | 'BMP_TOKEN' | 'BUSINESS_SETTLEMENT' | 'PI_MAINNET' | 'CROSS_CHAIN';

export interface BlockchainNode {
  id: string;
  name: string;
  url: string;
  role: 'PRIMARY_RPC' | 'REDUNDANT_MIRROR' | 'FAILOVER_BACKUP' | 'FUTURE_RPC';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  responseTimeMs: number;
  blockHeight: number;
  lastPingAt: string;
  errorCount: number;
  successCount: number;
  errorRate: number;
  nodeVersion: string;
  weight: number;
  circuitBreakerOpen: boolean;
}

export type LoadBalancingStrategy = 'ROUND_ROBIN' | 'PRIORITY' | 'LATENCY_BASED' | 'WEIGHTED';

export interface RpcHealthReport {
  activeNodeId: string;
  totalNodes: number;
  healthyNodesCount: number;
  averageLatencyMs: number;
  loadBalancingStrategy: LoadBalancingStrategy;
  nodes: BlockchainNode[];
  lastCheckedAt: string;
  totalRpcCallsHandled: number;
  cacheHitRatioPercent: number;
}

export type BlockchainEventType = 
  // Blockchain & Network Events
  | 'NEW_BLOCK'
  | 'WALLET_EVENT'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'TRANSACTION_PENDING'
  | 'TRANSACTION_CONFIRMED'
  | 'WALLET_UPDATED'
  | 'REWARD_EVENT'
  | 'REWARD_CREDITED'
  | 'REWARD_DEBITED'
  | 'RPC_CONNECTED'
  | 'RPC_DISCONNECTED'
  | 'RPC_FAILOVER'
  | 'RPC_RECOVERY'
  | 'LATENCY_WARNING'
  | 'NETWORK_STATUS_CHANGED'
  | 'BLOCK_SYNCED'
  | 'SETTLEMENT_COMPLETED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_RELEASED'
  // Marketplace Events
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'SERVICE_ADDED'
  | 'SERVICE_UPDATED'
  | 'STORE_UPDATED'
  | 'BUSINESS_UPDATED'
  | 'PRICE_CHANGED'
  | 'INVENTORY_CHANGED'
  | 'FEATURED_CAMPAIGN_UPDATED'
  // Order Events
  | 'ORDER_CREATED'
  | 'PAYMENT_VERIFIED'
  | 'ORDER_CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUND_COMPLETED'
  // Wallet & Mainnet Events
  | 'BALANCE_UPDATED'
  | 'REWARD_UPDATED'
  | 'TRANSACTION_CREATED'
  | 'SWAP_COMPLETED'
  | 'MAINNET_READY'
  // Notification Events
  | 'PUSH_NOTIFICATION'
  | 'EMAIL'
  | 'SMS'
  | 'IN_APP_NOTIFICATION'
  | 'TELEGRAM'
  | 'WHATSAPP'
  // Analytics & Queue Events
  | 'ANALYTICS_EVENT'
  | 'QUEUE_JOB_PROCESSED'
  | 'QUEUE_JOB_FAILED';

export interface BlockchainEvent {
  id: string;
  type: BlockchainEventType;
  timestamp: string;
  data: any;
  blockNumber?: number;
  txHash?: string;
}

export interface WalletAccount {
  userId: string;
  address: string;
  piTestnetBalance: number;
  bmpRewardBalance: number;
  bmpTokenBalance: number;
  merchantWalletBalance: number;
  businessWalletBalance: number;
  treasuryWalletBalance: number;
  escrowWalletBalance: number;
  settlementWalletBalance: number;
  businessSettlementBalance: number;
  lifetimeEarnedBmp: number;
  nonce: number;
  updatedAt: string;
}

export interface MasterLedgerEntry {
  entryId: string;
  transactionId: string;
  walletAddress: string;
  userId: string;
  asset: AssetType;
  amount: number;
  beforeBalance: number;
  afterBalance: number;
  referenceId: string;
  source: 'CHECKOUT' | 'REWARD' | 'SETTLEMENT' | 'REFUND' | 'ESCROW' | 'SWAP' | 'ADJUSTMENT';
  timestamp: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  hash?: string;
  blockHeight?: number;
  memo?: string;
}

export interface BlockchainTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  asset: AssetType;
  type: 'PAYMENT' | 'REWARD' | 'SETTLEMENT' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'SWAP';
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  fee: number;
  memo?: string;
  referenceId?: string;
  timestamp: string;
}

export interface SwapQuote {
  fromAsset: AssetType;
  toAsset: AssetType;
  amountIn: number;
  expectedAmountOut: number;
  exchangeRate: number;
  priceImpactPercent: number;
  slippageTolerancePercent: number;
  feeAmount: number;
  quoteValidUntil: string;
}

export interface EscrowContract {
  id: string;
  orderId: string;
  buyerUserId: string;
  sellerBusinessId: string;
  amountPi: number;
  status: 'LOCKED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED';
  createdAt: string;
  releasedAt?: string;
  txHash: string;
}

export interface MigrationPhaseStatus {
  phase: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DISABLED';
  recordsProcessed: number;
  lastSyncAt: string;
}

export interface BlockchainFeatureFlags {
  enablePiTestnetPayment: boolean;
  enableBmpRewards: boolean;
  enableBmpToken: boolean;
  enableMainnet: boolean;
  enableBmpSwap: boolean;
  enableEscrow: boolean;
  enableCrossChainBridge: boolean;
  enableDao: boolean;
  enableStaking: boolean;
  enableLiquidityPool: boolean;
}
