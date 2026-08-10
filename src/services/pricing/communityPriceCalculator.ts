/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  getSupportedCurrencies, 
  isSupportedCurrency, 
  normalizeCurrencyCode, 
  safeRoundNumber,
  convertLocalToUsd,
  DEFAULT_COMMUNITY_PI_USD_RATE,
  DEFAULT_FX_TO_USD_RATES,
} from './currencyRegistry';

export { DEFAULT_COMMUNITY_PI_USD_RATE };

export interface CommunityPriceCalculationInput {
  mode: 'DERIVED' | 'DIRECT';
  referenceCurrency?: string;
  referenceAmount?: number | string;
  userDefinedPiReference?: number | string;
  directCommunityPiAmount?: number | string;
  customFxRates?: Record<string, number>;
}

export interface CommunityPriceCalculationResult {
  success: boolean;
  communityPiAmount: number | null;
  mode: 'DERIVED' | 'DIRECT';
  referenceCurrency?: string;
  referenceAmount?: number;
  usdEquivalent?: number;
  userDefinedPiReference?: number;
  error?: string;
  disclaimer: string;
}

export const COMMUNITY_CALCULATOR_DISCLAIMER = 
  "This calculator helps you choose a Community Price based on the platform's $314,159 USD/Pi Community Reference Value. It does not represent a live market rate.";

export const COMMUNITY_EXCHANGE_SEPARATION_NOTE = 
  "Community Price is derived using the $314,159 USD/Pi reference rate and does not automatically follow live exchange prices.";

/**
 * Calculates Community Pi Price from a local currency product price.
 * Pipeline: LOCAL CURRENCY -> USD -> COMMUNITY USD/PI REFERENCE ($314,159) -> Pi VALUE
 */
export function calculateCommunityPiFromLocalPrice(
  localAmount: number,
  localCurrency: string,
  communityPiUsdRate: number = DEFAULT_COMMUNITY_PI_USD_RATE,
  customFxRates?: Record<string, number>
) {
  const normCurr = normalizeCurrencyCode(localCurrency);
  const usdVal = convertLocalToUsd(localAmount, normCurr, customFxRates);
  if (usdVal <= 0 || communityPiUsdRate <= 0) {
    return { usdEquivalent: 0, communityPiAmount: 0, communityPiUsdRate, fxRateUsed: 0 };
  }
  const piCalculated = safeRoundNumber(usdVal / communityPiUsdRate, 7);
  const fxRates = customFxRates || DEFAULT_FX_TO_USD_RATES;
  const fxRateUsed = fxRates[normCurr] ?? DEFAULT_FX_TO_USD_RATES[normCurr] ?? 1.0;
  return {
    usdEquivalent: usdVal,
    communityPiAmount: piCalculated,
    communityPiUsdRate,
    fxRateUsed,
  };
}

/**
 * Calculates and validates a Community Reference Value for products or services.
 * Uses the canonical pipeline: LOCAL CURRENCY -> USD EQUIVALENT -> COMMUNITY PI REFERENCE RATE.
 */
export function calculateCommunityPrice(input: CommunityPriceCalculationInput): CommunityPriceCalculationResult {
  const mode = input.mode || 'DERIVED';

  if (mode === 'DIRECT') {
    const rawVal = input.directCommunityPiAmount;
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return {
        success: false,
        communityPiAmount: null,
        mode: 'DIRECT',
        error: 'Please enter a valid Community Pi Price.',
        disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
      };
    }

    const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).trim());

    if (isNaN(numVal) || !isFinite(numVal)) {
      return {
        success: false,
        communityPiAmount: null,
        mode: 'DIRECT',
        error: 'Please enter a valid Community Pi Price.',
        disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
      };
    }

    if (numVal <= 0) {
      return {
        success: false,
        communityPiAmount: null,
        mode: 'DIRECT',
        error: 'Please enter a positive Community Pi Price.',
        disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
      };
    }

    const piAmount = safeRoundNumber(numVal, 7);

    return {
      success: true,
      communityPiAmount: piAmount,
      mode: 'DIRECT',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  // DERIVED MODE
  const currencyRaw = input.referenceCurrency;
  if (!currencyRaw) {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      error: 'Please select a reference currency.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  const normalizedCurr = normalizeCurrencyCode(currencyRaw);
  if (!isSupportedCurrency(normalizedCurr) || normalizedCurr === 'PI') {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      error: `Unsupported reference currency: ${currencyRaw}`,
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  const rawAmount = input.referenceAmount;
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      error: 'Please enter a valid reference value.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  const refAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).trim());
  if (isNaN(refAmount) || !isFinite(refAmount) || refAmount <= 0) {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      error: 'Please enter a valid reference value greater than zero.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  const rawRefPi = input.userDefinedPiReference ?? DEFAULT_COMMUNITY_PI_USD_RATE;
  const piRefValue = typeof rawRefPi === 'number' ? rawRefPi : parseFloat(String(rawRefPi).trim());
  if (isNaN(piRefValue) || !isFinite(piRefValue) || piRefValue <= 0) {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      referenceAmount: refAmount,
      error: 'Please enter a valid Pi reference value greater than zero.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  // Pipeline: LOCAL CURRENCY -> USD EQUIVALENT -> ÷ COMMUNITY PI USD REFERENCE RATE
  const usdEquivalent = convertLocalToUsd(refAmount, normalizedCurr, input.customFxRates);
  const calculated = usdEquivalent / piRefValue;
  if (!isFinite(calculated) || isNaN(calculated)) {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      referenceAmount: refAmount,
      usdEquivalent,
      userDefinedPiReference: piRefValue,
      error: 'Calculation resulted in an invalid number.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

  const piAmount = safeRoundNumber(calculated, 7);

  return {
    success: true,
    communityPiAmount: piAmount,
    mode: 'DERIVED',
    referenceCurrency: normalizedCurr,
    referenceAmount: refAmount,
    usdEquivalent,
    userDefinedPiReference: piRefValue,
    disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
  };
}
