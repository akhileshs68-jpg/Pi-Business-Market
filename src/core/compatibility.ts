/**
 * Pi Business Market - Enterprise Compatibility & Adapter Layer
 * Bridges legacy services, interfaces, and hooks to the new enterprise architecture,
 * guaranteeing ZERO regression for all existing pages and modules.
 */

import { eventBus } from './eventBus';
import { logger } from './logger';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { masterWalletService } from '../services/blockchain/masterWalletService';

export class EnterpriseCompatibilityLayer {
  /**
   * Universal Master Wallet Sync Adapter
   * Syncs profile, checkout, business, and rewards balance into the unified ledger.
   */
  public async syncUnifiedUserWallet(userId: string) {
    logger.info('Compatibility', `Syncing unified wallet balances for user ${userId}`);
    const masterWallet = await masterWalletService.syncMasterWalletDoc(userId);
    
    // Publish update event across event bus
    eventBus.publish('WALLET_UPDATED', masterWallet, userId);
    return masterWallet;
  }

  /**
   * Adapter wrapping legacy payment engine calls
   */
  public async executeLegacyPaymentAdapter(
    userId: string,
    amount: number,
    provider: 'bmp_rewards',
    description: string
  ) {
    logger.info('Compatibility', `Executing payment via adapter for ${userId} (${amount} ${provider})`);
    
    const balance = await paymentEngine.getBalance(provider, userId);
    if (balance < amount) {
      throw new Error('Insufficient BMP Rewards balance.');
    }
    const walletProvider = paymentEngine.getProvider(provider);
    return await walletProvider.debit(userId, amount, 'PURCHASE', description);
  }
}

export const compatibilityLayer = new EnterpriseCompatibilityLayer();
