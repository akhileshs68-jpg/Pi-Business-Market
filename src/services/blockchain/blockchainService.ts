/**
 * Master Blockchain Service Facade
 * Provides unified access to RPC Manager, Web3 Subscriptions, Dual Assets,
 * Providers, Swap Engine, Escrow Engine, and Migration Service.
 */

import { rpcManager } from './rpcManager';
import { subscriptionService } from './subscriptionService';
import { masterWalletService } from './masterWalletService';
import { masterLedgerService } from './masterLedgerService';
import { bmpSwapService } from './bmpSwapService';
import { bmpTokenMigrationService } from './bmpTokenMigrationService';
import { escrowService } from './escrowService';
import { piTestnetProvider } from './providers/PiTestnetProvider';
import { bmpRewardProvider } from './providers/BmpRewardProvider';
import { BLOCKCHAIN_FEATURE_FLAGS, isFeatureEnabled } from './blockchainFeatureFlags';
import { AssetType, BlockchainTransaction } from './blockchainTypes';

export class BlockchainService {
  public rpc = rpcManager;
  public events = subscriptionService;
  public masterWallet = masterWalletService;
  public masterLedger = masterLedgerService;
  public swap = bmpSwapService;
  public migration = bmpTokenMigrationService;
  public escrow = escrowService;
  public flags = BLOCKCHAIN_FEATURE_FLAGS;

  /**
   * Get active blockchain network status overview
   */
  public async getNetworkOverview() {
    const health = rpcManager.getHealthReport();
    const stream = subscriptionService.getConnectionStatus();
    const swapStatus = bmpSwapService.getSwapAvailability();
    const escrowStatus = escrowService.getEscrowStatus();

    return {
      networkName: 'Pi Network Testnet v1',
      activeAsset: 'PI_TESTNET',
      rewardAsset: 'BMP_REWARD',
      rpcHealth: health,
      streamStatus: stream,
      swapStatus,
      escrowStatus,
      featureFlags: this.flags
    };
  }

  /**
   * Get provider by asset type
   */
  public getProvider(asset: AssetType) {
    if (asset === 'PI_TESTNET') return piTestnetProvider;
    if (asset === 'BMP_REWARD' || asset === 'BMP_TOKEN') return bmpRewardProvider;
    return piTestnetProvider;
  }

  /**
   * Submit transaction to appropriate provider and record in master ledger
   */
  public async submitTransaction(
    asset: AssetType,
    fromUserId: string,
    toAddress: string,
    amount: number,
    memo?: string,
    referenceId?: string
  ): Promise<BlockchainTransaction> {
    const provider = this.getProvider(asset);
    const tx = await provider.sendTransaction(fromUserId, toAddress, amount, memo, referenceId);
    
    // Record in master immutable ledger
    await masterLedgerService.recordEntry({
      transactionId: tx.id,
      walletAddress: fromUserId,
      userId: fromUserId,
      asset,
      amount,
      beforeBalance: 0,
      afterBalance: amount,
      referenceId: referenceId || tx.id,
      source: asset === 'PI_TESTNET' ? 'CHECKOUT' : 'REWARD',
      status: 'CONFIRMED',
      hash: tx.hash,
      blockHeight: tx.blockNumber,
      memo: memo || tx.memo
    });

    // Publish transaction event into stream
    subscriptionService.publishEvent(
      asset === 'PI_TESTNET' ? 'PAYMENT_CONFIRMED' : 'REWARD_EVENT',
      tx,
      tx.hash
    );

    return tx;
  }
}

export const blockchainService = new BlockchainService();
