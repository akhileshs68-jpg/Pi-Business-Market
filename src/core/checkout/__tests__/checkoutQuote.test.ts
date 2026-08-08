import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pricingEngine, PricingEngine } from '../../../services/pricing/pricingEngine';
import { RateResolver, globalRateResolver } from '../../../services/pricing/rateProvider';
import { RateProvider, RateResult, PricingInput, PricingQuote, PricingSnapshot } from '../../../services/pricing/pricingTypes';
import { EnterpriseCheckoutEngine } from '../enterpriseCheckoutEngine';
import { CheckoutSession, OrderItem } from '../../../types';

class MockActiveRateProvider implements RateProvider {
  readonly providerId = 'mock_provider';
  readonly providerName = 'Mock Rate Provider';

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const now = new Date().toISOString();
    if (baseCurrency === 'USD' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'USD',
        quoteCurrency: 'PI',
        rate: 0.314159,
        source: 'mock_market',
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

describe('Phase 7 — Authoritative Checkout Quote System', () => {
  let mockResolver: RateResolver;
  let testEngine: PricingEngine;

  beforeEach(() => {
    mockResolver = new RateResolver(new MockActiveRateProvider());
    globalRateResolver.setActiveProvider(new MockActiveRateProvider());
    testEngine = new PricingEngine(mockResolver);
  });

  describe('Pricing Engine Quotes & Snapshots', () => {
    it('generates an authoritative PricingQuote with a 15-minute TTL', async () => {
      const input: PricingInput = {
        mode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 314.15,
      };

      const quote = await testEngine.createQuote(input);

      expect(quote).toBeDefined();
      expect(quote.quoteId).toMatch(/^q_/);
      expect(quote.status).toBe('ACTIVE');
      expect(quote.pricingMode).toBe('EXCHANGE');
      expect(quote.localCurrency).toBe('USD');
      expect(quote.localAmount).toBe(314.15);
      expect(typeof quote.piAmount).toBe('number');
      expect(quote.piAmount!).toBeGreaterThan(0);

      const createdTime = new Date(quote.createdAt).getTime();
      const expiresTime = new Date(quote.expiresAt).getTime();
      const durationMinutes = (expiresTime - createdTime) / (1000 * 60);

      expect(durationMinutes).toBeCloseTo(15, 1);
    });

    it('validates active, fresh quotes and rejects expired quotes', async () => {
      const input: PricingInput = {
        mode: 'COMMUNITY',
        communityPiAmount: 100,
        localCurrency: 'PI',
      };

      const activeQuote = await testEngine.createQuote(input);
      const activeValidation = testEngine.validateQuote(activeQuote);

      expect(activeValidation.valid).toBe(true);

      // Create expired quote simulation
      const expiredQuote: PricingQuote = {
        ...activeQuote,
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      };

      const expiredValidation = testEngine.validateQuote(expiredQuote);
      expect(expiredValidation.valid).toBe(false);
      expect(expiredValidation.reason).toContain('expired');
    });

    it('creates an immutable, frozen PricingSnapshot from a quote', async () => {
      const input: PricingInput = {
        mode: 'COMMUNITY',
        communityPiAmount: 50,
      };

      const quote = await testEngine.createQuote(input);
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot).toBeDefined();
      expect(snapshot.quoteId).toBe(quote.quoteId);
      expect(snapshot.piAmount).toBe(50);
      expect(snapshot.pricingEngineVersion).toBe(pricingEngine.version);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });

  describe('Order Summary & Snapshot Resolution', () => {
    it('calculates order summary breakdown incorporating session pricing snapshot', () => {
      const dummySnapshot: PricingSnapshot = {
        localCurrency: 'USD',
        localAmount: 100,
        pricingMode: 'EXCHANGE',
        piAmount: 2.5,
        rateUsed: 0.025,
        rateSource: 'Coingecko Test',
        rateProvider: 'coingecko',
        rateTimestamp: new Date().toISOString(),
        quoteId: 'q_test_123',
        pricingEngineVersion: '1.0.0',
        capturedAt: new Date().toISOString(),
      };

      const dummySession: CheckoutSession = {
        sessionId: 'sess_123',
        cartId: 'cart_123',
        userUid: 'user_123',
        couponCodes: [],
        currency: 'USD',
        subtotal: 2.5,
        discount: 0,
        tax: 0.125,
        shipping: 10,
        grandTotal: 12.625,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        pricingQuoteId: 'q_test_123',
        pricingSnapshot: dummySnapshot,
      };

      const items: OrderItem[] = [
        {
          itemId: 'item_1',
          orderId: 'sess_123',
          productId: 'p1',
          productName: 'Physical Item',
          quantity: 1,
          unitPrice: 2.5,
          subtotal: 2.5,
          tax: 0.125,
          discount: 0,
          status: 'active',
          isService: false,
          sellerName: 'Test Seller',
          storeName: 'Test Store',
          businessName: 'Test Biz',
        },
      ];

      const summary = EnterpriseCheckoutEngine.calculateOrderSummary(dummySession, items);

      expect(summary).toBeDefined();
      expect(summary.subtotal).toBe(2.5);
      expect(summary.shipping).toBe(10);
      expect(summary.tax).toBe(0.125);
      expect(summary.grandTotal).toBe(12.625);
      expect(summary.piTestnetAmount).toBe(12.625);
      expect(summary.bmpRewardsEstimate).toBe(Math.floor(12.625 * 10));
    });
  });
});
