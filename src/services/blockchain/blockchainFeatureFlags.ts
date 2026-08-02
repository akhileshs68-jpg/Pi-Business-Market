/**
 * Web3 & Blockchain Feature Flags
 * Controls active vs future capabilities across the platform.
 */

import { BlockchainFeatureFlags } from './blockchainTypes';

export const BLOCKCHAIN_FEATURE_FLAGS: BlockchainFeatureFlags = {
  // Currently Active Production Features
  enablePiTestnetPayment: true, // Active: Pi Testnet Pi is the exclusive currency for checkout
  enableBmpRewards: true,       // Active: Verified action rewards (purchase, review, share, referral)

  // Future Blockchain Capabilities (Disabled by Default)
  enableBmpToken: false,         // Disabled: On-chain BMP Token contract & airdrop disabled
  enableMainnet: false,          // Disabled: Mainnet network integration disabled
  enableBmpSwap: false,          // Disabled: Pi ↔ BMP Swap interface prepared but inactive
  enableEscrow: false,           // Disabled: Automated smart contract escrow disabled
  enableCrossChainBridge: false, // Disabled: Cross-chain bridges disabled
  enableDao: false,              // Disabled: On-chain DAO governance disabled
  enableStaking: false,          // Disabled: BMP Staking yield pools disabled
  enableLiquidityPool: false     // Disabled: Decentralized Liquidity Pool disabled
};

export function isFeatureEnabled(feature: keyof BlockchainFeatureFlags): boolean {
  return BLOCKCHAIN_FEATURE_FLAGS[feature] ?? false;
}
