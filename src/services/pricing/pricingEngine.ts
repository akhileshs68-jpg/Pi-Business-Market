import {
  PricingInput,
  PricingResult,
  PricingQuote,
  PricingSnapshot,
  PricingMode,
} from './pricingTypes';
import {
  normalizeCurrencyCode,
  isSupportedCurrency,
  safeRoundNumber,
} from './currencyRegistry';
import { RateResolver, globalRateResolver } from './rateProvider';

export class PricingEngine {
  readonly version = '1.0.0';
  private rateResolver: RateResolver;
  private defaultQuoteTtlMs = 900000; // 15 minutes default quote TTL

  constructor(resolver?: RateResolver) {
    this.rateResolver = resolver || globalRateResolver;
  }

  /**
   * Calculates the authoritative price for a given pricing mode & input.
   * Never hardcodes rates and never fabricates rates if unavailable.
   */
  async calculatePrice(input: PricingInput): Promise<PricingResult> {
    const now = new Date().toISOString();

    if (!input || typeof input !== 'object') {
      return {
        success: false,
        pricingMode: 'EXCHANGE',
        localCurrency: 'PI',
        localAmount: null,
        piAmount: null,
        rateUsed: null,
        rateSource: 'none',
        rateProvider: 'none',
        rateTimestamp: null,
        rateStatus: 'ERROR',
        pricingEngineVersion: this.version,
        calculatedAt: now,
        error: 'Pricing input must be a valid object',
      };
    }

    if (input.mode === 'COMMUNITY') {
      const communityAmount = Number(input.communityPiAmount);
      if (
        isNaN(communityAmount) ||
        !isFinite(communityAmount) ||
        communityAmount <= 0
      ) {
        return {
          success: false,
          pricingMode: 'COMMUNITY',
          localCurrency: input.localCurrency ? normalizeCurrencyCode(input.localCurrency) : 'PI',
          localAmount: input.localAmount ? Number(input.localAmount) : null,
          piAmount: null,
          rateUsed: null,
          rateSource: 'Community Defined Reference',
          rateProvider: 'community_seller',
          rateTimestamp: now,
          rateStatus: 'AVAILABLE',
          pricingEngineVersion: this.version,
          calculatedAt: now,
          error: 'Community Pi amount must be a positive finite number',
        };
      }

      const piAmount = safeRoundNumber(communityAmount, 7);
      const localCurrency = input.localCurrency
        ? normalizeCurrencyCode(input.localCurrency)
        : 'PI';
      const localAmount =
        input.localAmount !== undefined && input.localAmount !== null
          ? safeRoundNumber(Number(input.localAmount), 2)
          : null;

      return {
        success: true,
        pricingMode: 'COMMUNITY',
        localCurrency,
        localAmount,
        piAmount,
        rateUsed: null,
        rateSource: 'Community Defined Reference',
        rateProvider: 'community_seller',
        rateTimestamp: now,
        rateStatus: 'AVAILABLE',
        pricingEngineVersion: this.version,
        calculatedAt: now,
      };
    }

    if (input.mode === 'EXCHANGE') {
      const normCurrency = normalizeCurrencyCode(input.localCurrency);

      if (!isSupportedCurrency(normCurrency)) {
        return {
          success: false,
          pricingMode: 'EXCHANGE',
          localCurrency: normCurrency,
          localAmount: null,
          piAmount: null,
          rateUsed: null,
          rateSource: 'none',
          rateProvider: 'none',
          rateTimestamp: null,
          rateStatus: 'ERROR',
          pricingEngineVersion: this.version,
          calculatedAt: now,
          error: `Unsupported or invalid currency code: "${input.localCurrency}"`,
        };
      }

      const amount = Number(input.localAmount);
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return {
          success: false,
          pricingMode: 'EXCHANGE',
          localCurrency: normCurrency,
          localAmount: null,
          piAmount: null,
          rateUsed: null,
          rateSource: 'none',
          rateProvider: 'none',
          rateTimestamp: null,
          rateStatus: 'ERROR',
          pricingEngineVersion: this.version,
          calculatedAt: now,
          error: 'Local currency amount must be a positive finite number',
        };
      }

      const rateResult = await this.rateResolver.resolveRate(normCurrency, 'PI');

      if (
        rateResult.status === 'UNAVAILABLE' ||
        rateResult.status === 'ERROR' ||
        rateResult.rate === null ||
        isNaN(rateResult.rate) ||
        rateResult.rate <= 0
      ) {
        return {
          success: false,
          pricingMode: 'EXCHANGE',
          localCurrency: normCurrency,
          localAmount: safeRoundNumber(amount, 2),
          piAmount: null,
          rateUsed: null,
          rateSource: rateResult.source,
          rateProvider: rateResult.provider,
          rateTimestamp: rateResult.fetchedAt,
          rateStatus: rateResult.status,
          pricingEngineVersion: this.version,
          calculatedAt: now,
          error:
            rateResult.errorDetails ||
            'Live Pi exchange rate is temporarily unavailable. Please try again or use Community Pricing.',
        };
      }

      const piCalculated = safeRoundNumber(amount * rateResult.rate, 7);

      return {
        success: true,
        pricingMode: 'EXCHANGE',
        localCurrency: normCurrency,
        localAmount: safeRoundNumber(amount, 2),
        piAmount: piCalculated,
        rateUsed: rateResult.rate,
        rateSource: rateResult.source,
        rateProvider: rateResult.provider,
        rateTimestamp: rateResult.fetchedAt,
        rateStatus: rateResult.status,
        pricingEngineVersion: this.version,
        calculatedAt: now,
      };
    }

    return {
      success: false,
      pricingMode: (input as any)?.mode || 'EXCHANGE',
      localCurrency: 'PI',
      localAmount: null,
      piAmount: null,
      rateUsed: null,
      rateSource: 'none',
      rateProvider: 'none',
      rateTimestamp: null,
      rateStatus: 'ERROR',
      pricingEngineVersion: this.version,
      calculatedAt: now,
      error: `Invalid or unsupported pricing mode: "${(input as any).mode}"`,
    };
  }

  /**
   * Generates an immutable, time-bounded PricingQuote for checkout verification.
   */
  async createQuote(
    input: PricingInput,
    customTtlMs?: number
  ): Promise<PricingQuote> {
    const result = await this.calculatePrice(input);

    if (!result.success || result.piAmount === null || result.piAmount <= 0) {
      throw new Error(
        result.error || 'Pricing calculation failed. Cannot generate checkout quote.'
      );
    }

    const nowMs = Date.now();
    const ttl = typeof customTtlMs === 'number' ? customTtlMs : this.defaultQuoteTtlMs;
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + ttl).toISOString();
    const quoteId = `q_${nowMs}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      quoteId,
      pricingMode: result.pricingMode,
      localCurrency: result.localCurrency,
      localAmount: result.localAmount,
      piAmount: result.piAmount,
      rateUsed: result.rateUsed,
      rateSource: result.rateSource,
      rateProvider: result.rateProvider,
      rateTimestamp: result.rateTimestamp,
      rateStatus: result.rateStatus,
      createdAt,
      expiresAt,
      pricingEngineVersion: this.version,
      status: 'ACTIVE',
    };
  }

  /**
   * Pure validation helper for checking quote freshness, structural validity, and expiration.
   */
  validateQuote(quote: PricingQuote): { valid: boolean; reason?: string } {
    if (!quote || typeof quote !== 'object') {
      return { valid: false, reason: 'Quote object is missing or invalid' };
    }

    if (!quote.quoteId || typeof quote.quoteId !== 'string') {
      return { valid: false, reason: 'Quote ID is missing' };
    }

    if (quote.status !== 'ACTIVE') {
      return { valid: false, reason: `Quote status is ${quote.status}` };
    }

    if (
      typeof quote.piAmount !== 'number' ||
      isNaN(quote.piAmount) ||
      !isFinite(quote.piAmount) ||
      quote.piAmount <= 0
    ) {
      return { valid: false, reason: 'Quote contains an invalid Pi amount' };
    }

    const expiresTime = new Date(quote.expiresAt).getTime();
    if (isNaN(expiresTime) || Date.now() >= expiresTime) {
      return { valid: false, reason: 'Quote has expired' };
    }

    return { valid: true };
  }

  /**
   * Creates an immutable pricing snapshot for persistent record keeping in Orders, Payments, and Ledgers.
   */
  createPricingSnapshot(
    source: PricingResult | PricingQuote,
    overrideQuoteId?: string
  ): PricingSnapshot {
    const quoteId =
      overrideQuoteId || ('quoteId' in source ? source.quoteId : undefined);

    const snapshot: PricingSnapshot = {
      localCurrency: source.localCurrency,
      localAmount: source.localAmount,
      pricingMode: source.pricingMode,
      piAmount: source.piAmount || 0,
      rateUsed: source.rateUsed,
      rateSource: source.rateSource,
      rateProvider: source.rateProvider,
      rateTimestamp: source.rateTimestamp,
      quoteId,
      pricingEngineVersion: this.version,
      capturedAt: new Date().toISOString(),
    };

    return Object.freeze(snapshot);
  }
}

export const pricingEngine = new PricingEngine();
