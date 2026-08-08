export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SAR'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CNY'
  | 'PI'
  | string;

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
  locale: string;
  enabled: boolean;
  displayName: string;
  isCrypto?: boolean;
}

export type RateStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'STALE' | 'ERROR';

export interface RateResult {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number | null;
  source: string;
  provider: string;
  fetchedAt: string; // ISO 8601 string
  validFrom?: string; // ISO 8601 string
  validUntil?: string; // ISO 8601 string
  status: RateStatus;
  precision: number;
  version: string;
  errorDetails?: string;
}

export interface RateProvider {
  providerId: string;
  providerName: string;
  getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult>;
}

export type PricingMode = 'EXCHANGE' | 'COMMUNITY';

export interface ExchangePricingInput {
  mode: 'EXCHANGE';
  localCurrency: string;
  localAmount: number;
}

export interface CommunityPricingInput {
  mode: 'COMMUNITY';
  communityPiAmount: number;
  localCurrency?: string;
  localAmount?: number;
}

export type PricingInput = ExchangePricingInput | CommunityPricingInput;

export interface PricingResult {
  success: boolean;
  pricingMode: PricingMode;
  localCurrency: string;
  localAmount: number | null;
  piAmount: number | null;
  rateUsed: number | null;
  rateSource: string;
  rateProvider: string;
  rateTimestamp: string | null;
  rateStatus: RateStatus;
  pricingEngineVersion: string;
  calculatedAt: string;
  error?: string;
}

export type QuoteStatus = 'ACTIVE' | 'EXPIRED' | 'INVALID';

export interface PricingQuote {
  quoteId: string;
  pricingMode: PricingMode;
  localCurrency: string;
  localAmount: number | null;
  piAmount: number;
  rateUsed: number | null;
  rateSource: string;
  rateProvider: string;
  rateTimestamp: string | null;
  rateStatus: RateStatus;
  createdAt: string;
  expiresAt: string;
  pricingEngineVersion: string;
  status: QuoteStatus;
}

export interface PricingSnapshot {
  localCurrency: string;
  localAmount: number | null;
  pricingMode: PricingMode;
  piAmount: number;
  rateUsed: number | null;
  rateSource: string;
  rateProvider: string;
  rateTimestamp: string | null;
  quoteId?: string;
  pricingEngineVersion: string;
  capturedAt: string;
}

