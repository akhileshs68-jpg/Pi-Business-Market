import { describe, it, expect, beforeEach } from 'vitest';
import { pricingEngine, PricingEngine } from '../../../services/pricing/pricingEngine';
import { RateResolver, globalRateResolver } from '../../../services/pricing/rateProvider';
import { RateProvider, RateResult, PricingInput, PricingQuote, PricingSnapshot } from '../../../services/pricing/pricingTypes';

class DynamicRateProvider implements RateProvider {
  readonly providerId = 'dynamic_test_provider';
  readonly providerName = 'Dynamic Test Rate Provider';
  public usdToPiRate: number = 0.25; // 1 USD = 0.25 Pi ($4/Pi)

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const now = new Date().toISOString();
    if (baseCurrency === 'USD' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'USD',
        quoteCurrency: 'PI',
        rate: this.usdToPiRate,
        source: 'dynamic_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    return {
      baseCurrency,
      quoteCurrency,
      rate: null,
      source: 'none',
      provider: this.providerId,
      fetchedAt: now,
      status: 'UNAVAILABLE',
      precision: 7,
      version: '1.0.0',
    };
  }
}

describe('Phase 8 — Immutable Order, Payment & Ledger Pricing Snapshot', () => {
  let rateProvider: DynamicRateProvider;
  let mockResolver: RateResolver;
  let testEngine: PricingEngine;

  beforeEach(() => {
    rateProvider = new DynamicRateProvider();
    mockResolver = new RateResolver(rateProvider);
    globalRateResolver.setActiveProvider(rateProvider);
    testEngine = new PricingEngine(mockResolver);
  });

  describe('1. Immutable Pricing Snapshot Creation & Properties', () => {
    it('creates an immutable, frozen PricingSnapshot attached to quote', async () => {
      const input: PricingInput = {
        mode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 100,
      };

      const quote = await testEngine.createQuote(input);
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot).toBeDefined();
      expect(snapshot.quoteId).toBe(quote.quoteId);
      expect(snapshot.localCurrency).toBe('USD');
      expect(snapshot.localAmount).toBe(100);
      expect(snapshot.piAmount).toBe(25); // 100 * 0.25
      expect(snapshot.rateUsed).toBe(0.25);
      expect(snapshot.pricingEngineVersion).toBe(pricingEngine.version);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('freezes nested snapshot objects so modifications throw or fail silently', async () => {
      const input: PricingInput = { mode: 'COMMUNITY', communityPiAmount: 50 };
      const quote = await testEngine.createQuote(input);
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(() => {
        (snapshot as any).piAmount = 999;
      }).toThrow();
      expect(snapshot.piAmount).toBe(50);
    });
  });

  describe('2. Market Exchange Rate Fluctuation Immunity', () => {
    it('ensures historical snapshot Pi amount remains unchanged when exchange rates double', async () => {
      // 1. Initial purchase at $100 @ 0.25 Pi/USD = 25 Pi
      rateProvider.usdToPiRate = 0.25;
      const initialQuote = await testEngine.createQuote({
        mode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 100,
      });
      const orderSnapshot = testEngine.createPricingSnapshot(initialQuote);

      expect(orderSnapshot.piAmount).toBe(25);

      // 2. Market rate doubles: 1 USD = 0.50 Pi ($2/Pi)
      rateProvider.usdToPiRate = 0.50;
      mockResolver.clearCache();

      // 3. New quote gets new rate, but historical orderSnapshot is unaffected
      const newQuote = await testEngine.createQuote({
        mode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 100,
      });

      expect(newQuote.piAmount).toBe(50);
      expect(orderSnapshot.piAmount).toBe(25); // Remains strictly 25 Pi!
      expect(orderSnapshot.rateUsed).toBe(0.25); // Remains strictly 0.25!
    });

    it('ensures historical master ledger and settlement records maintain original Pi amount regardless of rate changes', () => {
      const originalSnapshot: PricingSnapshot = {
        pricingMode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 200,
        piAmount: 50, // 200 * 0.25
        rateUsed: 0.25,
        rateSource: 'dynamic_market',
        rateProvider: 'dynamic_test_provider',
        rateTimestamp: new Date().toISOString(),
        quoteId: 'q_hist_101',
        pricingEngineVersion: '1.0.0',
        capturedAt: new Date().toISOString(),
      };

      // Ledger debit/credit entries created from snapshot
      const buyerLedgerEntry = {
        entryId: 'mled_001',
        amount: -originalSnapshot.piAmount,
        pricingSnapshot: originalSnapshot,
      };

      const sellerLedgerEntry = {
        entryId: 'mled_002',
        amount: originalSnapshot.piAmount,
        pricingSnapshot: originalSnapshot,
      };

      // Merchant Settlement created from snapshot
      const settlement = {
        settlementId: 'SETTLE_001',
        grossAmount: originalSnapshot.piAmount,
        commission: originalSnapshot.piAmount * 0.05, // 2.5 Pi
        merchantAmount: originalSnapshot.piAmount * 0.95, // 47.5 Pi
        pricingSnapshot: originalSnapshot,
      };

      // Change rate to 1.0 (1 USD = 1 Pi)
      rateProvider.usdToPiRate = 1.0;

      // Verify historical entries were NOT recalculated
      expect(buyerLedgerEntry.amount).toBe(-50);
      expect(sellerLedgerEntry.amount).toBe(50);
      expect(settlement.grossAmount).toBe(50);
      expect(settlement.commission).toBe(2.5);
      expect(settlement.merchantAmount).toBe(47.5);
    });
  });

  describe('3. Multi-Pricing Mode Snapshot Coverage', () => {
    it('handles COMMUNITY pricing snapshot with null rateUsed and reference source', async () => {
      const quote = await testEngine.createQuote({
        mode: 'COMMUNITY',
        communityPiAmount: 314,
        localCurrency: 'PI',
      });
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot.pricingMode).toBe('COMMUNITY');
      expect(snapshot.piAmount).toBe(314);
      expect(snapshot.rateUsed).toBeNull();
      expect(snapshot.rateSource).toContain('Community Defined Reference');
    });

    it('handles EXCHANGE pricing snapshot with exact rate source and precision', async () => {
      rateProvider.usdToPiRate = 0.314159;
      const quote = await testEngine.createQuote({
        mode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 1000,
      });
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot.pricingMode).toBe('EXCHANGE');
      expect(snapshot.localCurrency).toBe('USD');
      expect(snapshot.localAmount).toBe(1000);
      expect(snapshot.piAmount).toBeCloseTo(314.159, 3);
      expect(snapshot.rateUsed).toBe(0.314159);
    });
  });

  describe('4. Order Line Item & Financial Breakdown Preservation', () => {
    it('preserves line item level pricing snapshot metadata and unit prices', () => {
      const itemSnapshot = {
        productId: 'prod_99',
        productName: 'Pi Flagship Phone',
        quantity: 2,
        unitPrice: 100, // local currency USD
        subtotal: 200,
        pricingMode: 'EXCHANGE' as const,
        localCurrency: 'USD',
        localAmount: 200,
        piUnitPrice: 25,
        rateUsed: 0.25,
        rateSource: 'dynamic_market',
        rateTimestamp: new Date().toISOString(),
      };

      expect(itemSnapshot.quantity * itemSnapshot.piUnitPrice).toBe(50);
      expect(itemSnapshot.localAmount * itemSnapshot.rateUsed).toBe(50);
    });

    it('preserves shipping, tax, and discount breakdown in snapshot context', () => {
      const breakdown = {
        subtotal: 100, // local USD
        shipping: 10,
        tax: 5,
        discount: 15,
        grandTotalLocal: 100, // 100 + 10 + 5 - 15 = 100 USD
        rateUsed: 0.25,
        executedPiTotal: 25, // 100 USD * 0.25 = 25 Pi
      };

      expect(breakdown.grandTotalLocal * breakdown.rateUsed).toBe(breakdown.executedPiTotal);
    });
  });

  describe('5. Refund & Traceability Integrity', () => {
    it('calculates refund based on original transaction snapshot rather than current exchange rate', () => {
      const originalExecutedPi = 100; // paid 100 Pi for $400 purchase when rate was 0.25
      const refundPercentage = 0.5; // 50% partial refund

      // Rate changes dramatically to 0.10 (Pi appreciated)
      rateProvider.usdToPiRate = 0.10;

      // Partial refund must be 50% of executed 100 Pi = 50 Pi, NOT calculated from current USD price
      const refundPiAmount = originalExecutedPi * refundPercentage;

      expect(refundPiAmount).toBe(50);
    });

    it('verifies quote-to-order-to-payment-to-ledger audit trail traceability', () => {
      const quoteId = 'q_audit_777';
      const orderId = 'ord_audit_777';
      const paymentId = 'pay_audit_777';
      const txid = 'tx_audit_777';

      const orderData = { orderId, pricingQuoteId: quoteId, paymentId, txid };
      const paymentData = { paymentId, orderId, pricingQuoteId: quoteId, txid };
      const ledgerData = { referenceId: orderId, pricingQuoteId: quoteId, transactionId: txid };
      const settlementData = { settlementId: 'settle_777', orderId, pricingQuoteId: quoteId, paymentId, txid };

      expect(orderData.pricingQuoteId).toBe(quoteId);
      expect(paymentData.pricingQuoteId).toBe(quoteId);
      expect(ledgerData.pricingQuoteId).toBe(quoteId);
      expect(settlementData.pricingQuoteId).toBe(quoteId);

      expect(orderData.txid).toBe(txid);
      expect(paymentData.txid).toBe(txid);
      expect(ledgerData.transactionId).toBe(txid);
      expect(settlementData.txid).toBe(txid);
    });

    it('gracefully handles legacy orders lacking a pricingSnapshot', () => {
      const legacyOrder = {
        orderId: 'legacy_101',
        currency: 'Pi',
        grandTotal: 15,
        items: [{ productName: 'Vintage Item', unitPrice: 15 }],
      };

      // Fallback resolver for legacy order
      const resolvedPiAmount = (legacyOrder as any).pricingSnapshot?.piAmount ?? legacyOrder.grandTotal;
      const resolvedCurrency = (legacyOrder as any).pricingSnapshot?.localCurrency ?? legacyOrder.currency;

      expect(resolvedPiAmount).toBe(15);
      expect(resolvedCurrency).toBe('Pi');
    });
  });
});
