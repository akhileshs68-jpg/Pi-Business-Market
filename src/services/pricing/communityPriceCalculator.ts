/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  getSupportedCurrencies, 
  isSupportedCurrency, 
  normalizeCurrencyCode, 
  safeRoundNumber 
} from './currencyRegistry';

export interface CommunityPriceCalculationInput {
  mode: 'DERIVED' | 'DIRECT';
  referenceCurrency?: string;
  referenceAmount?: number | string;
  userDefinedPiReference?: number | string;
  directCommunityPiAmount?: number | string;
}

export interface CommunityPriceCalculationResult {
  success: boolean;
  communityPiAmount: number | null;
  mode: 'DERIVED' | 'DIRECT';
  referenceCurrency?: string;
  referenceAmount?: number;
  userDefinedPiReference?: number;
  error?: string;
  disclaimer: string;
}

export const COMMUNITY_CALCULATOR_DISCLAIMER = 
  "This calculator helps you choose a Community Price. It does not represent a live Pi market/exchange price.";

export const COMMUNITY_EXCHANGE_SEPARATION_NOTE = 
  "Community Price is manually defined and does not automatically follow live exchange prices.";

/**
 * Calculates and validates a Community Reference Value for products or services.
 * This is a pure decision-support function and NEVER invokes live exchange rate providers or hardcodes Pi market prices.
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

  const rawRefPi = input.userDefinedPiReference;
  if (rawRefPi === undefined || rawRefPi === null || rawRefPi === '') {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      referenceAmount: refAmount,
      error: 'Please enter a user-defined Pi reference value.',
      disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
    };
  }

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

  // Calculate: Reference Currency Amount / User-Defined Pi Reference Value
  const calculated = refAmount / piRefValue;
  if (!isFinite(calculated) || isNaN(calculated)) {
    return {
      success: false,
      communityPiAmount: null,
      mode: 'DERIVED',
      referenceCurrency: normalizedCurr,
      referenceAmount: refAmount,
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
    userDefinedPiReference: piRefValue,
    disclaimer: COMMUNITY_CALCULATOR_DISCLAIMER,
  };
}
