import { PaymentProviderConfig } from '../types/payment';

export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'pi_testnet',
    name: 'Pi Testnet Wallet',
    icon: 'pi-network',
    enabled: true,
    description: 'Pay instantly with Pi Testnet SDK via Pi Browser',
    processingFee: 0,
  },
  {
    id: 'bmp_rewards',
    name: 'BMP Rewards',
    icon: 'coins',
    enabled: false,
    description: 'BMP is now used strictly as a loyalty & rewards system.',
    processingFee: 0,
  },
  {
    id: 'bmp_token' as any,
    name: 'BMP Token (Web3)',
    icon: 'coins',
    enabled: false,
    description: 'Future Web3 tokenized payment protocol',
    processingFee: 0,
  },
  {
    id: 'pi_mainnet' as any,
    name: 'Pi Mainnet',
    icon: 'pi-network',
    enabled: false,
    description: 'Future Pi Mainnet native production wallet',
    processingFee: 0,
  },
  {
    id: 'escrow' as any,
    name: 'Escrow Protection',
    icon: 'shield',
    enabled: false,
    description: 'Future multi-signature buyer protection escrow',
    processingFee: 0,
  },
  {
    id: 'split' as any,
    name: 'Split Payment',
    icon: 'split',
    enabled: false,
    description: 'Future multi-party split checkout',
    processingFee: 0,
  },
  {
    id: 'credits' as any,
    name: 'Business Credits',
    icon: 'credit-card',
    enabled: false,
    description: 'Future B2B trade credit line',
    processingFee: 0,
  },
  {
    id: 'gift' as any,
    name: 'Gift Card Balance',
    icon: 'gift',
    enabled: false,
    description: 'Future gift voucher redemption',
    processingFee: 0,
  }
];

