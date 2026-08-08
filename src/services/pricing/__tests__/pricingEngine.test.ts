import { describe, it, expect, beforeEach } from 'vitest';
import { PricingEngine } from '../pricingEngine';
import { RateResolver } from '../rateProvider';
import { RateProvider, RateResult } from '../pricingTypes';
import {
  normalizeCurrencyCode,
  isSupportedCurrency,
  getCurrencySymbol,
  getCurrencyPrecision,
  formatCurrencyAmount,
} from '../currencyRegistry';
import {
  resolveProductPricing,
  resolveServicePricing,
  resolveVariantPricing,
} from '../pricingCompatibility';

// Mock Rate Provider for tests
class MockActiveRateProvider implements RateProvider {
  readonly providerId = 'mock_provider';
  readonly providerName = 'Mock Rate Provider';

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const now = new Date().toISOString();
    if (baseCurrency === 'INR' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'INR',
        quoteCurrency: 'PI',
        rate: 0.01042, // 1 INR = 0.01042 Pi (1000 INR = 10.42 Pi)
        source: 'mock_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    if (baseCurrency === 'USD' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'USD',
        quoteCurrency: 'PI',
        rate: 0.314159, // 1 USD = 0.314159 Pi
        source: 'mock_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    if (baseCurrency === 'EUR' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'EUR',
        quoteCurrency: 'PI',
        rate: 0.35,
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
      errorDetails: 'Pair unavailable',
    };
  }
}

describe('PricingEngine & Currency Infrastructure Test Suite', () => {
  let mockResolver: RateResolver;
  let engineWithMock: PricingEngine;
  let engineDefault: PricingEngine;

  beforeEach(() => {
    mockResolver = new RateResolver(new MockActiveRateProvider());
    engineWithMock = new PricingEngine(mockResolver);
    engineDefault = new PricingEngine(); // Uses default unavailable provider
  });

  it('1. INR Exchange pricing with available rate', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    expect(res.success).toBe(true);
    expect(res.pricingMode).toBe('EXCHANGE');
    expect(res.localCurrency).toBe('INR');
    expect(res.localAmount).toBe(1000);
    expect(res.piAmount).toBe(10.42);
    expect(res.rateUsed).toBe(0.01042);
    expect(res.rateStatus).toBe('AVAILABLE');
  });

  it('2. USD Exchange pricing with available rate', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 100,
    });
    expect(res.success).toBe(true);
    expect(res.localCurrency).toBe('USD');
    expect(res.piAmount).toBe(31.4159);
  });

  it('3. EUR Exchange pricing with available rate', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'EUR',
      localAmount: 50,
    });
    expect(res.success).toBe(true);
    expect(res.localCurrency).toBe('EUR');
    expect(res.piAmount).toBe(17.5);
  });

  it('4. Exchange pricing with unavailable rate', async () => {
    const res = await engineDefault.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    expect(res.success).toBe(false);
    expect(res.piAmount).toBeNull();
    expect(res.rateStatus).toBe('UNAVAILABLE');
    expect(res.error).toContain('unavailable');
  });

  it('5. Exchange pricing with stale rate handling', async () => {
    // Resolver returns stale when expired
    const rateRes = await mockResolver.resolveRate('INR', 'PI');
    expect(rateRes.status).toBe('AVAILABLE');
  });

  it('6. Exchange pricing with invalid rate rejection', async () => {
    const badProvider: RateProvider = {
      providerId: 'bad',
      providerName: 'Bad Provider',
      getRate: async (b, q) => ({
        baseCurrency: b,
        quoteCurrency: q,
        rate: -5, // Invalid negative rate
        source: 'bad',
        provider: 'bad',
        fetchedAt: new Date().toISOString(),
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      }),
    };
    const badEngine = new PricingEngine(new RateResolver(badProvider));
    const res = await badEngine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 100,
    });
    expect(res.success).toBe(false);
    expect(res.piAmount).toBeNull();
  });

  it('7. Community pricing', async () => {
    const res = await engineDefault.calculatePrice({
      mode: 'COMMUNITY',
      communityPiAmount: 15,
      localCurrency: 'INR',
      localAmount: 1500,
    });
    expect(res.success).toBe(true);
    expect(res.pricingMode).toBe('COMMUNITY');
    expect(res.piAmount).toBe(15);
    expect(res.rateUsed).toBeNull();
    expect(res.rateSource).toContain('Community Defined');
  });

  it('8. Community pricing without rate provider', async () => {
    const res = await engineDefault.calculatePrice({
      mode: 'COMMUNITY',
      communityPiAmount: 25,
    });
    expect(res.success).toBe(true);
    expect(res.piAmount).toBe(25);
    expect(res.rateStatus).toBe('AVAILABLE');
  });

  it('9. Negative local amount rejection', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: -500,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('positive');
  });

  it('10. NaN amount rejection', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: NaN,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('positive finite number');
  });

  it('11. Infinity amount rejection', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: Infinity,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('positive finite number');
  });

  it('12. Zero amount rejection', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 0,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('positive finite number');
  });

  it('13. Unsupported currency rejection', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'XYZ_UNKNOWN',
      localAmount: 100,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unsupported or invalid currency');
  });

  it('14. Missing currency handling', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: '',
      localAmount: 100,
    });
    expect(res.localCurrency).toBe('PI');
  });

  it('15. Missing amount handling', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: (undefined as unknown) as number,
    });
    expect(res.success).toBe(false);
  });

  it('16. Quote creation', async () => {
    const quote = await engineWithMock.createQuote({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    expect(quote.quoteId).toMatch(/^q_/);
    expect(quote.piAmount).toBe(10.42);
    expect(quote.status).toBe('ACTIVE');
  });

  it('17. Quote ID generation uniqueness', async () => {
    const q1 = await engineWithMock.createQuote({
      mode: 'COMMUNITY',
      communityPiAmount: 10,
    });
    const q2 = await engineWithMock.createQuote({
      mode: 'COMMUNITY',
      communityPiAmount: 10,
    });
    expect(q1.quoteId).not.toEqual(q2.quoteId);
  });

  it('18. Quote expiration timestamp', async () => {
    const quote = await engineWithMock.createQuote(
      { mode: 'COMMUNITY', communityPiAmount: 5 },
      1000 // 1 sec TTL
    );
    const now = Date.now();
    const expiresAtMs = new Date(quote.expiresAt).getTime();
    expect(expiresAtMs - now).toBeLessThanOrEqual(1100);
    expect(expiresAtMs - now).toBeGreaterThanOrEqual(900);
  });

  it('19. Quote validation success', async () => {
    const quote = await engineWithMock.createQuote({
      mode: 'COMMUNITY',
      communityPiAmount: 50,
    });
    const val = engineWithMock.validateQuote(quote);
    expect(val.valid).toBe(true);
  });

  it('20. Expired quote rejection', async () => {
    const quote = await engineWithMock.createQuote(
      { mode: 'COMMUNITY', communityPiAmount: 10 },
      -1000 // Expired in past
    );
    const val = engineWithMock.validateQuote(quote);
    expect(val.valid).toBe(false);
    expect(val.reason).toContain('expired');
  });

  it('21. Invalid quote rejection', () => {
    const badQuote: any = {
      quoteId: 'q_123',
      status: 'CANCELLED',
      piAmount: 10,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    };
    const val = engineWithMock.validateQuote(badQuote);
    expect(val.valid).toBe(false);
    expect(val.reason).toContain('CANCELLED');
  });

  it('22. Pricing snapshot generation', async () => {
    const quote = await engineWithMock.createQuote({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    const snapshot = engineWithMock.createPricingSnapshot(quote);
    expect(snapshot.localCurrency).toBe('INR');
    expect(snapshot.localAmount).toBe(1000);
    expect(snapshot.piAmount).toBe(10.42);
    expect(snapshot.quoteId).toBe(quote.quoteId);
    expect(snapshot.capturedAt).toBeDefined();
  });

  it('23. Historical snapshot immutability', async () => {
    const quote = await engineWithMock.createQuote({
      mode: 'COMMUNITY',
      communityPiAmount: 10,
    });
    const snapshot = engineWithMock.createPricingSnapshot(quote);
    expect(() => {
      (snapshot as any).piAmount = 999;
    }).toThrow();
  });

  it('24. Legacy 3.8 conversion is NEVER used as exchange rate', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 10,
    });
    // Rate is 0.314159, not 3.8
    expect(res.rateUsed).toBe(0.314159);
    expect(res.rateUsed).not.toBe(3.8);
  });

  it('25. No fake Pi rate is generated by default provider', async () => {
    const res = await engineDefault.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 10,
    });
    expect(res.success).toBe(false);
    expect(res.piAmount).toBeNull();
    expect(res.rateStatus).toBe('UNAVAILABLE');
  });

  it('26. Future provider can replace active provider', async () => {
    const resolver = new RateResolver(); // Default unavailable
    const engine = new PricingEngine(resolver);

    const initialRes = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 100,
    });
    expect(initialRes.success).toBe(false);

    // Plug in new provider dynamically
    resolver.setActiveProvider(new MockActiveRateProvider());

    const updatedRes = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 100,
    });
    expect(updatedRes.success).toBe(true);
    expect(updatedRes.piAmount).toBe(1.042);
  });

  it('27. Currency normalization & registry helpers', () => {
    expect(normalizeCurrencyCode('₹')).toBe('INR');
    expect(normalizeCurrencyCode('  $  ')).toBe('USD');
    expect(normalizeCurrencyCode('  π  ')).toBe('PI');
    expect(isSupportedCurrency('INR')).toBe(true);
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencyPrecision('INR')).toBe(2);
    expect(getCurrencyPrecision('PI')).toBe(7);
    expect(formatCurrencyAmount(1000, 'INR')).toContain('1,000');
  });

  it('28. Phase 4 - Legacy Pi product resolves as LEGACY_PI without fake fiat rate', async () => {
    const legacyProduct = {
      productId: 'prod_legacy_1',
      price: 15.5,
      currency: 'PI',
    };

    const resolved = await resolveProductPricing(legacyProduct, mockResolver);
    expect(resolved.mode).toBe('LEGACY_PI');
    expect(resolved.isLegacy).toBe(true);
    expect(resolved.piAmount).toBe(15.5);
    expect(resolved.localAmount).toBeNull();
    expect(resolved.rateUsed).toBeNull();
    expect(resolved.rateSource).toBe('Legacy Historical Price');
  });

  it('29. Phase 4 - New Community product resolves as COMMUNITY mode', async () => {
    const communityProduct = {
      productId: 'prod_comm_1',
      pricingMode: 'COMMUNITY',
      communityPiAmount: 20,
      price: 20,
    };

    const resolved = await resolveProductPricing(communityProduct, mockResolver);
    expect(resolved.mode).toBe('COMMUNITY');
    expect(resolved.isLegacy).toBe(false);
    expect(resolved.piAmount).toBe(20);
    expect(resolved.rateUsed).toBeNull();
  });

  it('30. Phase 4 - New Exchange product calculates dynamic Pi amount', async () => {
    const exchangeProduct = {
      productId: 'prod_ex_1',
      pricingMode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    };

    const resolved = await resolveProductPricing(exchangeProduct, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.isLegacy).toBe(false);
    expect(resolved.localCurrency).toBe('INR');
    expect(resolved.localAmount).toBe(1000);
    expect(resolved.piAmount).toBe(10.42);
    expect(resolved.rateUsed).toBe(0.01042);
  });

  it('31. Phase 4 - Legacy Service resolves as LEGACY_PI service', async () => {
    const legacyService = {
      serviceId: 'srv_legacy_1',
      basePrice: 50,
      price: 50,
    };

    const resolved = await resolveServicePricing(legacyService, mockResolver);
    expect(resolved.mode).toBe('LEGACY_PI');
    expect(resolved.isLegacy).toBe(true);
    expect(resolved.piAmount).toBe(50);
  });

  it('32. Phase 4 - Exchange Service resolves dynamic Pi price', async () => {
    const exchangeService = {
      serviceId: 'srv_ex_1',
      pricingMode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 100,
    };

    const resolved = await resolveServicePricing(exchangeService, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.localCurrency).toBe('USD');
    expect(resolved.localAmount).toBe(100);
    expect(resolved.piAmount).toBe(31.4159);
  });

  it('33. Phase 4 - Quote/Consultation service preserves null piAmount when zero base price', async () => {
    const quoteService = {
      serviceId: 'srv_quote_1',
      pricingType: 'quote',
      pricingMode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 0,
    };

    const resolved = await resolveServicePricing(quoteService, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.piAmount).toBeNull();
  });

  it('34. Phase 4 - Product variant inherits parent Exchange pricing mode', async () => {
    const parentProduct = {
      productId: 'parent_1',
      pricingMode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    };

    const variant = {
      variantId: 'var_1',
      price: 2000,
      localAmount: 2000,
    };

    const resolved = await resolveVariantPricing(variant, parentProduct, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.localCurrency).toBe('INR');
    expect(resolved.localAmount).toBe(2000);
    expect(resolved.piAmount).toBe(20.84);
  });

  it('35. Phase 4 - Product variant with explicit Community mode overrides parent', async () => {
    const parentProduct = {
      productId: 'parent_1',
      pricingMode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    };

    const variant = {
      variantId: 'var_2',
      pricingMode: 'COMMUNITY',
      communityPiAmount: 5,
    };

    const resolved = await resolveVariantPricing(variant, parentProduct, mockResolver);
    expect(resolved.mode).toBe('COMMUNITY');
    expect(resolved.piAmount).toBe(5);
  });
});
