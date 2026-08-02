/**
 * External Chain Provider
 * Interface prepared for cross-chain liquidity and external network bridges. Guarded by feature flag.
 */

import { BlockchainProvider } from './BlockchainProvider';
import { BlockchainTransaction } from '../blockchainTypes';
import { isFeatureEnabled } from '../blockchainFeatureFlags';

export class ExternalChainProvider implements BlockchainProvider {
  public id = 'external_chain_provider';
  public name = 'External Cross-Chain Bridge';
  public networkId = 'external-bridge-v1';
  public asset = 'BMP_TOKEN' as const;

  public async isConnected(): Promise<boolean> {
    return isFeatureEnabled('enableCrossChainBridge');
  }

  public async getBalance(userId: string): Promise<number> {
    if (!isFeatureEnabled('enableCrossChainBridge')) {
      throw new Error('[ExternalChainProvider] Cross-chain features are currently disabled.');
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
    if (!isFeatureEnabled('enableCrossChainBridge')) {
      throw new Error('[ExternalChainProvider] Cross-chain bridge transfers are disabled.');
    }
    throw new Error('Bridge inactive');
  }

  public async getTransactionStatus(txHashOrId: string): Promise<BlockchainTransaction | null> {
    return null;
  }
}

export const externalChainProvider = new ExternalChainProvider();
