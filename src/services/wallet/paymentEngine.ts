import { PaymentMethodId } from '../../types/payment';
import { bmpRewardsProvider } from './providers/bmpRewardsProvider';
import { piTestnetProvider } from './providers/piTestnetProvider';
import { WalletProvider } from './walletTypes';

const providers: Record<string, WalletProvider> = {
  bmp_rewards: bmpRewardsProvider,
  pi_testnet: piTestnetProvider,
};

export const paymentEngine = {
  getProvider(methodId: PaymentMethodId): WalletProvider {
    const provider = providers[methodId as string];
    if (!provider) {
      throw new Error(`Wallet provider ${methodId} is not supported yet.`);
    }
    return provider;
  },

  async processMarketplacePayment(
    methodId: PaymentMethodId,
    buyerId: string,
    sellerId: string,
    amount: number,
    orderId: string
  ): Promise<{ txid: string }> {
    const provider = this.getProvider(methodId);
    
    // Debit buyer
    const debitTxid = await provider.debit(
      buyerId, 
      amount, 
      'MARKETPLACE_ORDER', 
      `Payment for order ${orderId}`,
      orderId
    );

    // Credit seller
    await provider.credit(
      sellerId,
      amount,
      'MARKETPLACE_ORDER',
      `Sale from order ${orderId}`,
      orderId
    );

    return { txid: debitTxid };
  },

  async getBalance(methodId: PaymentMethodId, userId: string): Promise<number> {
    const provider = this.getProvider(methodId);
    return provider.getBalance(userId);
  }
};
