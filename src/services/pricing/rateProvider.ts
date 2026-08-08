import { RateProvider, RateResult } from './pricingTypes';
import { normalizeCurrencyCode } from './currencyRegistry';

/**
 * Default Unavailable Rate Provider
 * Activated when no live external exchange provider or authoritative reference source is explicitly configured.
 * Guarantees that the system explicitly returns STATUS = UNAVAILABLE without fabricating or hardcoding mock rates.
 */
export class DefaultUnavailableRateProvider implements RateProvider {
  readonly providerId = 'default_unavailable_provider';
  readonly providerName = 'Default Unavailable Rate Provider';

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const normBase = normalizeCurrencyCode(baseCurrency);
    const normQuote = normalizeCurrencyCode(quoteCurrency);
    const now = new Date().toISOString();

    // Identity rate: 1 unit of currency X is always 1 unit of currency X
    if (normBase === normQuote) {
      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: 1.0,
        source: 'identity',
        provider: this.providerId,
        fetchedAt: now,
        validFrom: now,
        validUntil: new Date(Date.now() + 86400000).toISOString(), // 24 hours
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }

    return {
      baseCurrency: normBase,
      quoteCurrency: normQuote,
      rate: null,
      source: 'none',
      provider: this.providerId,
      fetchedAt: now,
      status: 'UNAVAILABLE',
      precision: 7,
      version: '1.0.0',
      errorDetails: `Live exchange rate is temporarily unavailable. No authoritative provider is configured for pair ${normBase}/${normQuote}.`,
    };
  }
}

/**
 * Central Rate Resolver
 * Manages active provider strategy, rate caching, freshness timestamps, and cache bypass controls.
 */
export class RateResolver {
  private activeProvider: RateProvider;
  private rateCache: Map<string, { result: RateResult; expiresAt: number }> = new Map();
  private cacheTtlMs: number = 300000; // 5 minutes default display TTL

  constructor(provider?: RateProvider) {
    this.activeProvider = provider || new DefaultUnavailableRateProvider();
  }

  public setActiveProvider(provider: RateProvider) {
    this.activeProvider = provider;
    this.rateCache.clear();
  }

  public getActiveProviderId(): string {
    return this.activeProvider.providerId;
  }

  public async resolveRate(
    baseCurrency: string,
    quoteCurrency: string,
    bypassCache: boolean = false
  ): Promise<RateResult> {
    const normBase = normalizeCurrencyCode(baseCurrency);
    const normQuote = normalizeCurrencyCode(quoteCurrency);
    const cacheKey = `${normBase}_${normQuote}`;
    const nowMs = Date.now();

    if (!bypassCache && this.rateCache.has(cacheKey)) {
      const cached = this.rateCache.get(cacheKey)!;
      if (cached.expiresAt > nowMs) {
        return cached.result;
      }
      // If cached item expired but was valid, return with STALE status
      if (cached.result.status === 'AVAILABLE') {
        return {
          ...cached.result,
          status: 'STALE',
        };
      }
    }

    try {
      const result = await this.activeProvider.getRate(normBase, normQuote);
      if (result.status === 'AVAILABLE') {
        this.rateCache.set(cacheKey, {
          result,
          expiresAt: nowMs + this.cacheTtlMs,
        });
      }
      return result;
    } catch (err: any) {
      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: null,
        source: 'error',
        provider: this.activeProvider.providerId,
        fetchedAt: new Date().toISOString(),
        status: 'ERROR',
        precision: 7,
        version: '1.0.0',
        errorDetails: err?.message || 'Rate resolution failed unexpectedly',
      };
    }
  }

  public clearCache() {
    this.rateCache.clear();
  }
}

export const globalRateResolver = new RateResolver();
