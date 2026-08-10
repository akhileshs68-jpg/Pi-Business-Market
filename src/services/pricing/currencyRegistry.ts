import { CurrencyDefinition } from './pricingTypes';

export const CURRENCY_REGISTRY: Record<string, CurrencyDefinition> = {
  PI: {
    code: 'PI',
    name: 'Pi Cryptocurrency',
    symbol: 'π',
    decimalPrecision: 7,
    locale: 'en-US',
    enabled: true,
    displayName: 'Pi (π)',
    isCrypto: true,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPrecision: 2,
    locale: 'en-IN',
    enabled: true,
    displayName: 'Indian Rupee (INR)',
  },
  USD: {
    code: 'USD',
    name: 'United States Dollar',
    symbol: '$',
    decimalPrecision: 2,
    locale: 'en-US',
    enabled: true,
    displayName: 'US Dollar (USD)',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPrecision: 2,
    locale: 'de-DE',
    enabled: true,
    displayName: 'Euro (EUR)',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    decimalPrecision: 2,
    locale: 'en-GB',
    enabled: true,
    displayName: 'British Pound (GBP)',
  },
  AED: {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'د.إ',
    decimalPrecision: 2,
    locale: 'ar-AE',
    enabled: true,
    displayName: 'UAE Dirham (AED)',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    decimalPrecision: 2,
    locale: 'ar-SA',
    enabled: true,
    displayName: 'Saudi Riyal (SAR)',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    decimalPrecision: 2,
    locale: 'en-CA',
    enabled: true,
    displayName: 'Canadian Dollar (CAD)',
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimalPrecision: 2,
    locale: 'en-AU',
    enabled: true,
    displayName: 'Australian Dollar (AUD)',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPrecision: 0,
    locale: 'ja-JP',
    enabled: true,
    displayName: 'Japanese Yen (JPY)',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimalPrecision: 2,
    locale: 'zh-CN',
    enabled: true,
    displayName: 'Chinese Yuan (CNY)',
  },
};

const SYMBOL_TO_CODE_MAP: Record<string, string> = {
  'π': 'PI',
  'pi': 'PI',
  'PI': 'PI',
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'د.إ': 'AED',
  'ر.س': 'SAR',
  'CA$': 'CAD',
  'A$': 'AUD',
  '¥': 'JPY',
};

/**
 * Normalizes raw currency inputs (symbols, codes, aliases) into standardized UPPERCASE currency codes.
 * Returns 'PI' if code is empty/falsy, or the uppercase normalized code.
 */
export function normalizeCurrencyCode(rawCode: string | undefined | null): string {
  if (!rawCode) return 'PI';
  const trimmed = rawCode.trim();
  if (!trimmed) return 'PI';

  const upper = trimmed.toUpperCase();

  // 1. Direct registry hit
  if (CURRENCY_REGISTRY[upper]) {
    return upper;
  }

  // 2. Direct symbol/alias lookup
  if (SYMBOL_TO_CODE_MAP[trimmed]) {
    return SYMBOL_TO_CODE_MAP[trimmed];
  }
  if (SYMBOL_TO_CODE_MAP[upper]) {
    return SYMBOL_TO_CODE_MAP[upper];
  }

  // 3. Known text aliases
  if (upper === 'RS' || upper === 'RUPEE' || upper === 'RUPEES') return 'INR';
  if (upper === 'PI' || upper === 'π' || upper === 'PI COIN') return 'PI';
  if (upper === 'DOLLAR' || upper === 'USD') return 'USD';
  if (upper === 'EURO' || upper === 'EUR') return 'EUR';
  if (upper === 'POUND' || upper === 'GBP') return 'GBP';

  return upper;
}

/**
 * Checks whether a given currency code or symbol is supported and enabled in the registry.
 */
export function isSupportedCurrency(rawCode: string | undefined | null): boolean {
  if (!rawCode) return false;
  const normalized = normalizeCurrencyCode(rawCode);
  const def = CURRENCY_REGISTRY[normalized];
  return Boolean(def && def.enabled);
}

/**
 * Retrieves the CurrencyDefinition for a given currency code or symbol.
 */
export function getCurrency(rawCode: string | undefined | null): CurrencyDefinition | null {
  const normalized = normalizeCurrencyCode(rawCode);
  return CURRENCY_REGISTRY[normalized] || null;
}

/**
 * Returns the symbol for a given currency code. Fallback to raw code or empty string.
 */
export function getCurrencySymbol(rawCode: string | undefined | null): string {
  const curr = getCurrency(rawCode);
  return curr ? curr.symbol : (rawCode || '');
}

/**
 * Returns the decimal precision for a currency code (defaults to 2 if unknown, 7 for PI).
 */
export function getCurrencyPrecision(rawCode: string | undefined | null): number {
  const curr = getCurrency(rawCode);
  return curr ? curr.decimalPrecision : 2;
}

/**
 * Safely rounds a numeric monetary value to the requested decimal precision without floating point drift.
 */
export function safeRoundNumber(val: number, precision: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const factor = Math.pow(10, precision);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a monetary amount into a clean, localized string using the currency definition rules.
 */
export function formatCurrencyAmount(amount: number, rawCode: string | undefined | null): string {
  const normalized = normalizeCurrencyCode(rawCode);
  const curr = getCurrency(normalized);
  const precision = curr ? curr.decimalPrecision : 2;
  const safeAmount = safeRoundNumber(amount, precision);

  if (normalized === 'PI') {
    return `${safeAmount} π`;
  }

  if (curr && curr.locale) {
    try {
      return new Intl.NumberFormat(curr.locale, {
        style: 'currency',
        currency: curr.code,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(safeAmount);
    } catch {
      // Fall through to manual formatting
    }
  }

  const symbol = curr ? curr.symbol : normalized;
  return `${symbol}${safeAmount.toFixed(precision)}`;
}

export const DEFAULT_COMMUNITY_PI_USD_RATE = 314159;

export const DEFAULT_FX_TO_USD_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 0.011976, // 1 INR = ~0.011976 USD (1 USD = ~83.5 INR)
  EUR: 1.085,    // 1 EUR = ~1.085 USD
  GBP: 1.270,    // 1 GBP = ~1.270 USD
  AED: 0.2723,   // 1 AED = ~0.2723 USD
  SAR: 0.2666,   // 1 SAR = ~0.2666 USD
  CAD: 0.7300,   // 1 CAD = ~0.7300 USD
  AUD: 0.6550,   // 1 AUD = ~0.6550 USD
  JPY: 0.0067,   // 1 JPY = ~0.0067 USD
  CNY: 0.1390,   // 1 CNY = ~0.1390 USD
};

/**
 * Converts a local fiat currency amount into USD equivalent using authoritative FX rates.
 */
export function convertLocalToUsd(
  localAmount: number,
  localCurrency: string,
  customFxRates?: Record<string, number>
): number {
  if (isNaN(localAmount) || !isFinite(localAmount) || localAmount <= 0) return 0;
  const normCurr = normalizeCurrencyCode(localCurrency);
  if (normCurr === 'USD') return safeRoundNumber(localAmount, 2);
  
  const fxRates = customFxRates || DEFAULT_FX_TO_USD_RATES;
  const rateToUsd = fxRates[normCurr] ?? DEFAULT_FX_TO_USD_RATES[normCurr] ?? 1.0;
  return safeRoundNumber(localAmount * rateToUsd, 4);
}

/**
 * Converts a USD amount into a local fiat currency equivalent using authoritative FX rates.
 */
export function convertUsdToLocal(
  usdAmount: number,
  targetCurrency: string,
  customFxRates?: Record<string, number>
): number {
  if (isNaN(usdAmount) || !isFinite(usdAmount) || usdAmount <= 0) return 0;
  const normCurr = normalizeCurrencyCode(targetCurrency);
  if (normCurr === 'USD') return safeRoundNumber(usdAmount, 2);

  const fxRates = customFxRates || DEFAULT_FX_TO_USD_RATES;
  const rateToUsd = fxRates[normCurr] ?? DEFAULT_FX_TO_USD_RATES[normCurr] ?? 1.0;
  if (rateToUsd <= 0) return usdAmount;
  
  const precision = getCurrencyPrecision(normCurr);
  return safeRoundNumber(usdAmount / rateToUsd, precision);
}

/**
 * Returns an array of all enabled CurrencyDefinitions from the registry.
 */
export function getSupportedCurrencies(): CurrencyDefinition[] {
  return Object.values(CURRENCY_REGISTRY).filter(c => c.enabled);
}
