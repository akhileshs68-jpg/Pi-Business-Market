import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CoinGeckoRateProvider } from '../providers/coingeckoRateProvider';
import { PricingEngine } from '../pricingEngine';
import { RateResolver } from '../rateProvider';
import { resolveProductPricing } from '../pricingCompatibility';

describe('CoinGeckoRateProvider & Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. CoinGecko successful response for INR, USD, EUR, GBP, AED, SAR, CAD, AUD, JPY, CNY', async () => {
    const mockPrices = {
      usd: 0.1,
      inr: 10.0,
      eur: 0.09,
      gbp: 0.08,
      aed: 0.36,
      sar: 0.37,
      cad: 0.13,
      aud: 0.14,
      jpy: 15.0,
      cny: 0.72,
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/pricing/rate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, rates: mockPrices }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 'pi-network': mockPrices }),
      });
    });

    const provider = new CoinGeckoRateProvider();

    // Check INR -> PI (1 PI = 10 INR => 1 INR = 0.1 PI)
    const inrRate = await provider.getRate('INR', 'PI');
    expect(inrRate.status).toBe('AVAILABLE');
    expect(inrRate.rate).toBe(0.1);
    expect(inrRate.provider).toBe('CoinGecko');

    // Check PI -> INR (1 PI = 10.0 INR)
    const piInrRate = await provider.getRate('PI', 'INR');
    expect(piInrRate.status).toBe('AVAILABLE');
    expect(piInrRate.rate).toBe(10.0);

    // Check USD -> PI (1 PI = 0.1 USD => 1 USD = 10 PI)
    const usdRate = await provider.getRate('USD', 'PI');
    expect(usdRate.status).toBe('AVAILABLE');
    expect(usdRate.rate).toBe(10);

    // Check EUR, GBP, AED, SAR, CAD, AUD, JPY, CNY
    for (const curr of ['EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY']) {
      const res = await provider.getRate(curr, 'PI');
      expect(res.status).toBe('AVAILABLE');
      expect(res.rate).toBeGreaterThan(0);
    }
  });

  it('2. Handles HTTP failure gracefully returning UNAVAILABLE status', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const provider = new CoinGeckoRateProvider();
    const rate = await provider.getRate('INR', 'PI');
    expect(rate.status).toBe('UNAVAILABLE');
    expect(rate.rate).toBeNull();
    expect(rate.errorDetails).toContain('Pi market rate temporarily unavailable');
  });

  it('3. Handles timeout/abort errors gracefully', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('The operation was aborted'));
    });

    const provider = new CoinGeckoRateProvider();
    const rate = await provider.getRate('INR', 'PI');
    expect(rate.status).toBe('UNAVAILABLE');
    expect(rate.rate).toBeNull();
  });

  it('4. Handles invalid JSON response without crashing', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      })
    );

    const provider = new CoinGeckoRateProvider();
    const rate = await provider.getRate('INR', 'PI');
    expect(rate.status).toBe('UNAVAILABLE');
    expect(rate.rate).toBeNull();
  });

  it('5. Handles missing Pi price in response', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { usd: 0.1 } }), // missing INR
      })
    );

    const provider = new CoinGeckoRateProvider();
    const rate = await provider.getRate('INR', 'PI');
    expect(rate.status).toBe('UNAVAILABLE');
    expect(rate.rate).toBeNull();
  });

  it('6. Rate normalization: 1 PI = 100 INR => rate for 1 INR = 0.01 PI', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { inr: 100 } }),
      })
    );

    const provider = new CoinGeckoRateProvider();
    const res = await provider.getRate('INR', 'PI');
    expect(res.rate).toBe(0.01);
  });

  it('7. Rate caching: avoids duplicate network requests within cache TTL', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { inr: 10 } }),
      });
    });

    const provider = new CoinGeckoRateProvider();
    await provider.getRate('INR', 'PI');
    await provider.getRate('INR', 'PI');
    await provider.getRate('USD', 'PI');

    expect(callCount).toBe(1);
  });

  it('8. Deterministic test: 1 PI = 100 INR converts 1000 INR to 10 PI; 1 PI = 125 INR converts 1000 INR to 8 PI', async () => {
    // Phase A: 1 PI = 100 INR
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { inr: 100, usd: 1.25, eur: 1.15 } }),
      })
    );

    const provider1 = new CoinGeckoRateProvider();
    const engine1 = new PricingEngine(new RateResolver(provider1));

    const res1 = await engine1.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });

    expect(res1.success).toBe(true);
    expect(res1.piAmount).toBe(10); // 1000 / 100 = 10 PI

    // Phase B: Market rate updates to 1 PI = 125 INR
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { inr: 125, usd: 1.25, eur: 1.15 } }),
      })
    );

    const provider2 = new CoinGeckoRateProvider();
    const engine2 = new PricingEngine(new RateResolver(provider2));

    const res2 = await engine2.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });

    expect(res2.success).toBe(true);
    expect(res2.piAmount).toBe(8); // 1000 / 125 = 8 PI
  });

  it('9. Pricing tests: $100 and €100 convert dynamically', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, rates: { usd: 0.1, eur: 0.08 } }),
      })
    );

    const provider = new CoinGeckoRateProvider();
    const engine = new PricingEngine(new RateResolver(provider));

    // $100 at 1 PI = $0.10 => 100 / 0.10 = 1000 PI
    const usdRes = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'USD',
      localAmount: 100,
    });
    expect(usdRes.success).toBe(true);
    expect(usdRes.piAmount).toBe(1000);

    // €100 at 1 PI = €0.08 => 100 / 0.08 = 1250 PI
    const eurRes = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'EUR',
      localAmount: 100,
    });
    expect(eurRes.success).toBe(true);
    expect(eurRes.piAmount).toBe(1250);
  });

  it('10. Regression tests: COMMUNITY, LEGACY_PI, no fake rate / 3.8 / GCV / GCB', async () => {
    // Provider fails completely
    global.fetch = vi.fn().mockImplementation(() => Promise.reject(new Error('Offline')));

    const provider = new CoinGeckoRateProvider();
    const engine = new PricingEngine(new RateResolver(provider));

    // EXCHANGE calculation when provider is offline
    const exRes = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    expect(exRes.success).toBe(false);
    expect(exRes.rateStatus).toBe('UNAVAILABLE');
    expect(exRes.piAmount).toBeNull();
    // Verify no fake fallback values like 3.8, 314, 314159 exist
    expect(exRes.piAmount).not.toBe(3.8);
    expect(exRes.piAmount).not.toBe(314159);

    // COMMUNITY pricing remains unaffected by provider state
    const commProduct = {
      pricingMode: 'COMMUNITY',
      communityPiAmount: 25,
      localCurrency: 'INR',
      localAmount: 1000,
    };
    const commRes = await resolveProductPricing(commProduct, new RateResolver(provider));
    expect(commRes.piAmount).toBe(25);
    expect(commRes.mode).toBe('COMMUNITY');

    // LEGACY_PI pricing remains unaffected
    const legacyProduct = {
      price: 10,
      currency: 'PI',
    };
    const legacyRes = await resolveProductPricing(legacyProduct, new RateResolver(provider));
    expect(legacyRes.piAmount).toBe(10);
    expect(legacyRes.mode).toBe('LEGACY_PI');
  });
});
