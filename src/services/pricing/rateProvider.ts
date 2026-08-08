import { RateProvider, RateResult } from './pricingTypes';
import { normalizeCurrencyCode } from './currencyRegistry';
import { CoinGeckoRateProvider } from './providers/coingeckoRateProvider';

export { CoinGeckoRateProvider };

/**
 * Normalizes exchange rate values based on rate direction.
 * Handles both DIRECT (1 BASE = X QUOTE) and INVERTED (1 QUOTE = Y BASE) representations.
 */
export function normalizeRateDirection(
  rawRate: number,
  direction: 'DIRECT' | 'INVERTED'
): number {
  if (isNaN(rawRate) || !isFinite(rawRate) || rawRate <= 0) return 0;
  return direction === 'INVERTED' ? 1 / rawRate : rawRate;
}

export interface ConfigurableRateProviderConfig {
  apiUrl?: string;
  apiKey?: string;
  staticRates?: Record<string, number>; // Pair key e.g. "INR_PI" or "PI_INR"
  rateDirection?: 'DIRECT' | 'INVERTED';
  providerId?: string;
  providerName?: string;
}

/**
 * Configurable External Rate Provider
 * Supports configurable API endpoints, static rates, and bidirectional rate normalization.
 * Returns STATUS = UNAVAILABLE when no authoritative rate is configured or available.
 */
export class ConfigurableRateProvider implements RateProvider {
  readonly providerId: string;
  readonly providerName: string;
  private config: ConfigurableRateProviderConfig;

  constructor(config: ConfigurableRateProviderConfig = {}) {
    this.providerId = config.providerId || 'configurable_rate_provider';
    this.providerName = config.providerName || 'Configurable Exchange Rate Provider';
    this.config = config;
  }

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const normBase = normalizeCurrencyCode(baseCurrency);
    const normQuote = normalizeCurrencyCode(quoteCurrency);
    const now = new Date().toISOString();

    if (normBase === normQuote) {
      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: 1.0,
        source: 'identity',
        provider: this.providerId,
        fetchedAt: now,
        validFrom: now,
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }

    const directKey = `${normBase}_${normQuote}`;
    const invertedKey = `${normQuote}_${normBase}`;

    let resolvedRate: number | null = null;
    let rateSource = 'none';

    if (this.config.staticRates) {
      if (typeof this.config.staticRates[directKey] === 'number' && this.config.staticRates[directKey] > 0) {
        resolvedRate = normalizeRateDirection(this.config.staticRates[directKey], this.config.rateDirection || 'DIRECT');
        rateSource = 'configured_direct_rate';
      } else if (typeof this.config.staticRates[invertedKey] === 'number' && this.config.staticRates[invertedKey] > 0) {
        // Inverted pair: 1 QUOTE = Y BASE -> 1 BASE = 1/Y QUOTE
        resolvedRate = 1 / this.config.staticRates[invertedKey];
        rateSource = 'configured_inverted_rate';
      }
    }

    const apiUrl =
      this.config.apiUrl ||
      (typeof process !== 'undefined' ? process.env?.PI_EXCHANGE_RATE_API_URL : undefined) ||
      (typeof window !== 'undefined' && (window as any)?.__PI_RATE_API_URL);

    if (!resolvedRate && apiUrl) {
      try {
        const response = await fetch(`${apiUrl}?base=${normBase}&quote=${normQuote}`, {
          headers: this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.rate === 'number' && data.rate > 0) {
            resolvedRate = normalizeRateDirection(
              data.rate,
              data.rateDirection || this.config.rateDirection || 'DIRECT'
            );
            rateSource = data.source || 'external_api';
          } else if (typeof data.invertedRate === 'number' && data.invertedRate > 0) {
            resolvedRate = 1 / data.invertedRate;
            rateSource = data.source || 'external_api_inverted';
          }
        }
      } catch (err: any) {
        return {
          baseCurrency: normBase,
          quoteCurrency: normQuote,
          rate: null,
          source: 'api_error',
          provider: this.providerId,
          fetchedAt: now,
          status: 'ERROR',
          precision: 7,
          version: '1.0.0',
          errorDetails: `Failed to fetch rate from configured external endpoint: ${err?.message || 'Network error'}`,
        };
      }
    }

    if (resolvedRate !== null && !isNaN(resolvedRate) && isFinite(resolvedRate) && resolvedRate > 0) {
      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: resolvedRate,
        source: rateSource,
        provider: this.providerId,
        fetchedAt: now,
        validFrom: now,
        validUntil: new Date(Date.now() + 300000).toISOString(),
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

export const globalRateResolver = new RateResolver(new CoinGeckoRateProvider());
