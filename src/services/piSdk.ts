/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, paymentId: string) => void;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: {
    storeId: string;
    productId?: string;
    itemsCount: number;
  };
}

const WALLET_BALANCE_KEY = 'pi_biz_mkt_wallet_balance';

export class PiSdkSim {
  /**
   * Gets the current user's sandbox Pi Wallet balance.
   */
  static getBalance(): number {
    const bal = localStorage.getItem(WALLET_BALANCE_KEY);
    if (!bal) {
      localStorage.setItem(WALLET_BALANCE_KEY, '350.00');
      return 350.00;
    }
    return parseFloat(bal);
  }

  /**
   * Sets the user's sandbox Pi Wallet balance.
   */
  static setBalance(amount: number): void {
    localStorage.setItem(WALLET_BALANCE_KEY, amount.toFixed(2));
  }

  /**
   * Simulates a blockchain mining reward faucet (adds 50 Pi).
   */
  static requestFaucet(): number {
    const current = this.getBalance();
    const updated = current + 50.00;
    this.setBalance(updated);
    return updated;
  }

  /**
   * Simulates Pi.authenticate()
   */
  static async authenticate(): Promise<{ username: string; uid: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          username: 'pi_pioneer_88',
          uid: 'user_active_pioneer'
        });
      }, 800);
    });
  }

  /**
   * Simulates the multi-step Pi blockchain transactional workflow.
   * Prompts visual states and triggers SDK callbacks after node confirmations.
   */
  static executePayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): void {
    const paymentId = `pay_pi_${Math.random().toString(36).substring(2, 11)}`;
    const txHash = `tx_pi_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const balance = this.getBalance();

    if (balance < paymentData.amount) {
      setTimeout(() => {
        callbacks.onError(
          new Error(`Insufficient Pi Balance. Required: ${paymentData.amount} Pi, Available: ${balance} Pi.`),
          paymentId
        );
      }, 500);
      return;
    }

    // Step 1: SDK Payment Request Created

    // We will trigger onReadyForServerApproval which simulates merchant server interaction
    setTimeout(() => {
      try {
        callbacks.onReadyForServerApproval(paymentId);
        
        // Step 2: Simulate consensus node mining verify and deduct balance
        setTimeout(() => {
          const freshBalance = this.getBalance();
          this.setBalance(freshBalance - paymentData.amount);

          // Trigger server-side completion callback with simulated transaction ID
          callbacks.onReadyForServerCompletion(paymentId, txHash);
        }, 1500);

      } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error('Payment lifecycle failed'), paymentId);
      }
    }, 1000);
  }
}
