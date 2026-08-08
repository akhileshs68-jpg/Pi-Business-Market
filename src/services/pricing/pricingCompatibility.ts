import { PricingMode, RateStatus } from './pricingTypes';
import { PricingEngine, pricingEngine as globalPricingEngine } from './pricingEngine';
import { RateResolver } from './rateProvider';

export type EffectivePricingMode = 'EXCHANGE' | 'COMMUNITY' | 'LEGACY_PI';

export interface ResolvedPricing {
  mode: EffectivePricingMode;
  localCurrency: string;
  localAmount: number | null;
  piAmount: number | null;
  rateUsed: number | null;
  rateSource: string;
  rateProvider: string;
  rateTimestamp: string | null;
  rateStatus: RateStatus;
  isLegacy: boolean;
  error?: string;
}

/**
 * Centralized compatibility resolver for Products.
 * Safely resolves NEW EXCHANGE, NEW COMMUNITY, and LEGACY_PI product prices.
 * Never invents a fake fiat amount or fake exchange rate for legacy Pi products.
 */
export async function resolveProductPricing(
  product: any,
  resolver?: RateResolver
): Promise<ResolvedPricing> {
  const engine = resolver ? new PricingEngine(resolver) : globalPricingEngine;

  if (!product || typeof product !== 'object') {
    return {
      mode: 'LEGACY_PI',
      localCurrency: 'PI',
      localAmount: null,
      piAmount: 0,
      rateUsed: null,
      rateSource: 'none',
      rateProvider: 'none',
      rateTimestamp: null,
      rateStatus: 'AVAILABLE',
      isLegacy: true,
    };
  }

  const mode: PricingMode | undefined = product.pricingMode;

  if (mode === 'COMMUNITY') {
    const communityAmount =
      product.communityPiAmount !== undefined && product.communityPiAmount !== null
        ? Number(product.communityPiAmount)
        : product.communityPrice !== undefined && product.communityPrice !== null
        ? Number(product.communityPrice)
        : Number(product.price || 0);

    const calc = await engine.calculatePrice({
      mode: 'COMMUNITY',
      communityPiAmount: communityAmount,
      localCurrency: product.localCurrency || product.fiatCurrency,
      localAmount: product.localAmount || product.fiatAmount,
    });

    return {
      mode: 'COMMUNITY',
      localCurrency: calc.localCurrency || 'PI',
      localAmount: calc.localAmount,
      piAmount: calc.piAmount,
      rateUsed: null,
      rateSource: calc.rateSource,
      rateProvider: calc.rateProvider,
      rateTimestamp: calc.rateTimestamp,
      rateStatus: calc.rateStatus,
      isLegacy: false,
      error: calc.error,
    };
  }

  if (mode === 'EXCHANGE') {
    const localCurrency = product.localCurrency || product.fiatCurrency || 'INR';
    const localAmount =
      product.localAmount !== undefined && product.localAmount !== null
        ? Number(product.localAmount)
        : product.fiatAmount !== undefined && product.fiatAmount !== null
        ? Number(product.fiatAmount)
        : Number(product.price || 0);

    const calc = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency,
      localAmount,
    });

    if (!calc.success && (product.fallbackPiPrice || product.fallbackPrice)) {
      const fallbackAmount = Number(product.fallbackPiPrice || product.fallbackPrice);
      return {
        mode: 'EXCHANGE',
        localCurrency,
        localAmount,
        piAmount: fallbackAmount,
        rateUsed: null,
        rateSource: 'Fallback Pi Price',
        rateProvider: 'fallback_config',
        rateTimestamp: null,
        rateStatus: 'UNAVAILABLE',
        isLegacy: false,
      };
    }

    return {
      mode: 'EXCHANGE',
      localCurrency: calc.localCurrency,
      localAmount: calc.localAmount,
      piAmount: calc.piAmount,
      rateUsed: calc.rateUsed,
      rateSource: calc.rateSource,
      rateProvider: calc.rateProvider,
      rateTimestamp: calc.rateTimestamp,
      rateStatus: calc.rateStatus,
      isLegacy: false,
      error: calc.error,
    };
  }

  // LEGACY_PI: Product has no pricingMode or legacy data
  const legacyPrice =
    typeof product.price === 'number'
      ? product.price
      : typeof product.regularPrice === 'number'
      ? product.regularPrice
      : 0;

  return {
    mode: 'LEGACY_PI',
    localCurrency: product.currency || 'PI',
    localAmount: null,
    piAmount: Number(legacyPrice),
    rateUsed: null,
    rateSource: 'Legacy Historical Price',
    rateProvider: 'legacy_data',
    rateTimestamp: null,
    rateStatus: 'AVAILABLE',
    isLegacy: true,
  };
}

/**
 * Centralized compatibility resolver for Services.
 * Safely handles fixed/hourly/daily/weekly/monthly/quote services with new or legacy pricing models.
 */
export async function resolveServicePricing(
  service: any,
  resolver?: RateResolver
): Promise<ResolvedPricing> {
  const engine = resolver ? new PricingEngine(resolver) : globalPricingEngine;

  if (!service || typeof service !== 'object') {
    return {
      mode: 'LEGACY_PI',
      localCurrency: 'PI',
      localAmount: null,
      piAmount: 0,
      rateUsed: null,
      rateSource: 'none',
      rateProvider: 'none',
      rateTimestamp: null,
      rateStatus: 'AVAILABLE',
      isLegacy: true,
    };
  }

  const isQuote =
    service.pricingType === 'quote' ||
    service.pricingType === 'free_consultation' ||
    service.pricingType === 'Negotiable';

  const mode: PricingMode | undefined = service.pricingMode;

  if (mode === 'COMMUNITY') {
    const communityAmount =
      service.communityPiAmount !== undefined && service.communityPiAmount !== null
        ? Number(service.communityPiAmount)
        : Number(service.basePrice ?? service.price ?? 0);

    const calc = await engine.calculatePrice({
      mode: 'COMMUNITY',
      communityPiAmount: communityAmount,
      localCurrency: service.localCurrency,
      localAmount: service.localAmount,
    });

    return {
      mode: 'COMMUNITY',
      localCurrency: calc.localCurrency || 'PI',
      localAmount: calc.localAmount,
      piAmount: isQuote && communityAmount === 0 ? null : calc.piAmount,
      rateUsed: null,
      rateSource: calc.rateSource,
      rateProvider: calc.rateProvider,
      rateTimestamp: calc.rateTimestamp,
      rateStatus: calc.rateStatus,
      isLegacy: false,
      error: calc.error,
    };
  }

  if (mode === 'EXCHANGE') {
    const localCurrency = service.localCurrency || 'INR';
    const localAmount =
      service.localAmount !== undefined && service.localAmount !== null
        ? Number(service.localAmount)
        : Number(service.basePrice ?? service.price ?? 0);

    const calc = await engine.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency,
      localAmount,
    });

    return {
      mode: 'EXCHANGE',
      localCurrency: calc.localCurrency,
      localAmount: calc.localAmount,
      piAmount: isQuote && localAmount === 0 ? null : calc.piAmount,
      rateUsed: calc.rateUsed,
      rateSource: calc.rateSource,
      rateProvider: calc.rateProvider,
      rateTimestamp: calc.rateTimestamp,
      rateStatus: calc.rateStatus,
      isLegacy: false,
      error: calc.error,
    };
  }

  // LEGACY_PI
  const legacyPrice =
    typeof service.basePrice === 'number'
      ? service.basePrice
      : typeof service.price === 'number'
      ? service.price
      : 0;

  return {
    mode: 'LEGACY_PI',
    localCurrency: service.currency || 'PI',
    localAmount: null,
    piAmount: isQuote && legacyPrice === 0 ? null : Number(legacyPrice),
    rateUsed: null,
    rateSource: 'Legacy Historical Price',
    rateProvider: 'legacy_data',
    rateTimestamp: null,
    rateStatus: 'AVAILABLE',
    isLegacy: true,
  };
}

/**
 * Centralized compatibility resolver for Product Variants.
 * Variant inherits parent pricing model if not explicitly defined on variant.
 */
export async function resolveVariantPricing(
  variant: any,
  parentProduct?: any,
  resolver?: RateResolver
): Promise<ResolvedPricing> {
  if (!variant || typeof variant !== 'object') {
    return resolveProductPricing(parentProduct, resolver);
  }

  // If variant has explicit pricingMode
  if (variant.pricingMode) {
    return resolveProductPricing(variant, resolver);
  }

  // If parent exists and has pricingMode
  if (parentProduct && parentProduct.pricingMode) {
    const parentMode: PricingMode = parentProduct.pricingMode;
    if (parentMode === 'EXCHANGE') {
      const localCurrency =
        variant.localCurrency ||
        variant.fiatCurrency ||
        parentProduct.localCurrency ||
        parentProduct.fiatCurrency ||
        'INR';

      const localAmount =
        variant.localAmount !== undefined && variant.localAmount !== null
          ? Number(variant.localAmount)
          : variant.fiatAmount !== undefined && variant.fiatAmount !== null
          ? Number(variant.fiatAmount)
          : variant.price !== undefined && variant.price !== null && Number(variant.price) > 0
          ? Number(variant.price)
          : parentProduct.localAmount !== undefined && parentProduct.localAmount !== null
          ? Number(parentProduct.localAmount)
          : parentProduct.fiatAmount !== undefined && parentProduct.fiatAmount !== null
          ? Number(parentProduct.fiatAmount)
          : Number(parentProduct.price || 0);

      return resolveProductPricing(
        {
          pricingMode: 'EXCHANGE',
          localCurrency,
          localAmount,
          fallbackPiPrice: variant.fallbackPiPrice || parentProduct.fallbackPiPrice,
        },
        resolver
      );
    }

    if (parentMode === 'COMMUNITY') {
      const communityPiAmount =
        variant.communityPiAmount !== undefined && variant.communityPiAmount !== null
          ? Number(variant.communityPiAmount)
          : variant.communityPrice !== undefined && variant.communityPrice !== null
          ? Number(variant.communityPrice)
          : variant.price !== undefined && variant.price !== null && Number(variant.price) > 0
          ? Number(variant.price)
          : parentProduct.communityPiAmount !== undefined && parentProduct.communityPiAmount !== null
          ? Number(parentProduct.communityPiAmount)
          : parentProduct.communityPrice !== undefined && parentProduct.communityPrice !== null
          ? Number(parentProduct.communityPrice)
          : Number(parentProduct.price || 0);

      return resolveProductPricing(
        {
          pricingMode: 'COMMUNITY',
          communityPiAmount,
        },
        resolver
      );
    }
  }

  // Fallback to legacy variant pricing
  return resolveProductPricing(variant, resolver);
}
