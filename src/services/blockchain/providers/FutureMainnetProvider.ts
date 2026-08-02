/**
 * Future Mainnet Blockchain Provider
 * Interface prepared for future Pi Mainnet migration. Guarded by feature flag.
 */

import { BlockchainProvider } from './BlockchainProvider';
import { BlockchainTransaction } from '../blockchainTypes';
import { isFeatureEnabled } from '../blockchainFeatureFlags';

export class FutureMainnetProvider implements BlockchainProvider {
  public id = 'future_mainnet_provider';
  public name = 'Pi Network Mainnet (Future)';
  public networkId = 'pi-mainnet-v1';
  public asset = 'PI_TESTNET' as const;

  public async isConnected(): Promise<boolean> {
    return isFeatureEnabled('enableMainnet');
  }

  public async getBalance(userId: string): Promise<number> {
    if (!isFeatureEnabled('enableMainnet')) {
      throw new Error('[FutureMainnetProvider] Mainnet features are currently disabled pending official network release.');
    }
    return 0;
  }

  public async sendTransaction(
    fromUserId: string,
    toAddress: string,
    amount: number,
    memo?: string,
    referenceId?: string
  ): Promise<BlockchainTransaction> {
    if (!isFeatureEnabled('enableMainnet')) {
      throw new Error('[FutureMainnetProvider] Mainnet transactions are disabled.');
    }
    throw new Error('Mainnet not active');
  }

  public async getTransactionStatus(txHashOrId: string): Promise<BlockchainTransaction | null> {
    return null;
  }
}

export const futureMainnetProvider = new FutureMainnetProvider();
