import { PaymentProviderConfig } from '../types/payment';

export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'bmp_rewards',
    name: 'BMP Rewards',
    icon: 'coins',
    enabled: true,
    description: 'Pay securely with your internal BMP Rewards balance.',
    processingFee: 0,
  },
  {
    id: 'pi_testnet',
    name: 'Pi Testnet Wallet',
    icon: 'pi-network',
    enabled: false,
    description: 'Pay securely with Pi Testnet (Coming Soon)',
    processingFee: 0,
  },
  {
    id: 'bmp_token',
    name: 'BMP Token',
    icon: 'coins',
    enabled: false,
    description: 'Future BMP Token implementation',
    processingFee: 0,
  },
  {
    id: 'pi_mainnet',
    name: 'Pi Mainnet',
    icon: 'pi-network',
    enabled: false,
    description: 'Future Pi Mainnet integration',
    processingFee: 0,
  },
];
