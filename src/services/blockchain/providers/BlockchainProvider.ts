/**
 * Blockchain Provider Abstraction Interface
 * Enables polymorphic routing across Pi Testnet, BMP Rewards Ledger,
 * Future Mainnet, and External Chains.
 */

import { AssetType, BlockchainTransaction } from '../blockchainTypes';

export interface BlockchainProvider {
  id: string;
  name: string;
  networkId: string;
  asset: AssetType;

  isConnected(): Promise<boolean>;
  getBalance(userId: string): Promise<number>;
  sendTransaction(
    fromUserId: string,
    toAddress: string,
    amount: number,
    memo?: string,
    referenceId?: string
  ): Promise<BlockchainTransaction>;
  getTransactionStatus(txHashOrId: string): Promise<BlockchainTransaction | null>;
}
