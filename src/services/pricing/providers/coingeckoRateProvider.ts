import { RateProvider, RateResult } from '../pricingTypes';
import { normalizeCurrencyCode } from '../currencyRegistry';

export interface CoinGeckoRateProviderConfig {
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

/**
 * CoinGecko Live Market Rate Provider for Pi Network.
 * Strictly implements the central RateProvider interface.
 * Retrieves real Pi Network market price data from CoinGecko (via backend proxy or direct API fallback).
 * Never fabricates or hardcodes exchange rates.
 */
export class CoinGeckoRateProvider implements RateProvider {
  readonly providerId = 'CoinGecko';
  readonly providerName = 'CoinGecko';

  private apiUrl: string;
  private apiKey: string | undefined;
  private timeoutMs: number;

  // In-memory cache for provider responses (60 sec TTL) to prevent API spamming
  private rateCache: Map<string, { data: Record<string, number>; timestamp: number }> = new Map();
  private cacheTtlMs = 60000;

  constructor(config: CoinGeckoRateProviderConfig = {}) {
    this.apiUrl = config.apiUrl || '/api/pricing/rate';
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.COINGECKO_API_KEY : undefined);
    this.timeoutMs = config.timeoutMs || 8000;
  }

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const normBase = normalizeCurrencyCode(baseCurrency);
    const normQuote = normalizeCurrencyCode(quoteCurrency);
    const now = new Date().toISOString();

    // Identity rate: 1 unit of currency X = 1 unit of currency X
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

    // Determine target fiat currency and direction
    let targetFiat = '';
    let isFiatToBase = false; // true if converting FIAT -> PI

    if (normBase === 'PI') {
      targetFiat = normQuote;
      isFiatToBase = false;
    } else if (normQuote === 'PI') {
      targetFiat = normBase;
      isFiatToBase = true;
    } else {
      // Pair between non-PI currencies
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
        errorDetails: `CoinGecko provider currently resolves Pi exchange pairs only. Pair ${normBase}/${normQuote} is unsupported.`,
      };
    }

    try {
      const prices = await this.fetchCoinGeckoPrices();
      const fiatLower = targetFiat.toLowerCase();
      const piPriceInFiat = prices[fiatLower];

      if (typeof piPriceInFiat !== 'number' || isNaN(piPriceInFiat) || !isFinite(piPriceInFiat) || piPriceInFiat <= 0) {
        return {
          baseCurrency: normBase,
          quoteCurrency: normQuote,
          rate: null,
          source: 'CoinGecko Market Data',
          provider: this.providerId,
          fetchedAt: now,
          status: 'UNAVAILABLE',
          precision: 7,
          version: '1.0.0',
          errorDetails: `Pi market rate temporarily unavailable for currency ${targetFiat}.`,
        };
      }

      // Canonical Normalization:
      // CoinGecko returns: 1 PI = piPriceInFiat LOCAL_CURRENCY (e.g. 1 PI = 8.69 INR)
      // If converting INR -> PI: rate = 1 / 8.69 = 0.1150747986...
      // If converting PI -> INR: rate = 8.69
      const calculatedRate = isFiatToBase ? (1 / piPriceInFiat) : piPriceInFiat;

      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: calculatedRate,
        source: 'CoinGecko Market Data',
        provider: this.providerId,
        fetchedAt: now,
        validFrom: now,
        validUntil: new Date(Date.now() + 300000).toISOString(),
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    } catch (err: any) {
      return {
        baseCurrency: normBase,
        quoteCurrency: normQuote,
        rate: null,
        source: 'CoinGecko Market Data',
        provider: this.providerId,
        fetchedAt: now,
        status: 'UNAVAILABLE',
        precision: 7,
        version: '1.0.0',
        errorDetails: 'Pi market rate temporarily unavailable. Please try again shortly.',
      };
    }
  }

  private async fetchCoinGeckoPrices(): Promise<Record<string, number>> {
    const cacheKey = 'coingecko_pi_prices';
    const cached = this.rateCache.get(cacheKey);
    const nowMs = Date.now();

    if (cached && (nowMs - cached.timestamp) < this.cacheTtlMs) {
      return cached.data;
    }

    let prices: Record<string, number> | null = null;

    // Strategy 1: Try local backend proxy endpoint first (/api/pricing/rate)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      
      const response = await fetch('/api/pricing/rate', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.rates && typeof json.rates === 'object') {
          prices = {};
          for (const [k, v] of Object.entries(json.rates)) {
            if (typeof v === 'number' && v > 0) {
              prices[k.toLowerCase()] = v;
            }
          }
        }
      }
    } catch (err) {
      // Backend proxy unavailable or network error — fall through to Strategy 2
    }

    // Strategy 2: Direct CoinGecko public API call
    if (!prices) {
      const currencies = 'usd,inr,eur,gbp,aed,sar,cad,aud,jpy,cny';
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=pi-network,pi-network-iou&vs_currencies=${currencies}&include_last_updated_at=true`;
      
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (this.apiKey) {
        headers['x-cg-demo-api-key'] = this.apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Check pi-network or pi-network-iou
      const piData = data['pi-network'] || data['pi-network-iou'];
      if (!piData || typeof piData !== 'object') {
        throw new Error('CoinGecko API response missing Pi Network data');
      }

      prices = {};
      for (const [k, v] of Object.entries(piData)) {
        if (typeof v === 'number' && v > 0 && k !== 'last_updated_at') {
          prices[k.toLowerCase()] = v;
        }
      }
    }

    if (!prices || Object.keys(prices).length === 0) {
      throw new Error('Failed to resolve valid Pi prices from CoinGecko');
    }

    this.rateCache.set(cacheKey, { data: prices, timestamp: nowMs });
    return prices;
  }
}
