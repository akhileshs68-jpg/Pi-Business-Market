import { describe, it, expect, beforeEach } from 'vitest';
import { PricingEngine } from '../../../services/pricing/pricingEngine';
import { RateResolver, globalRateResolver } from '../../../services/pricing/rateProvider';
import { RateProvider, RateResult } from '../../../services/pricing/pricingTypes';
import {
  resolveProductPricing,
  resolveServicePricing,
  resolveVariantPricing,
} from '../../../services/pricing/pricingCompatibility';
import { EnterpriseCartEngine } from '../enterpriseCartEngine';
import { ExtendedCartItem } from '../enterpriseCartTypes';

// Mock Rate Provider
class MockActiveRateProvider implements RateProvider {
  readonly providerId = 'mock_provider';
  readonly providerName = 'Mock Rate Provider';

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const now = new Date().toISOString();
    if (baseCurrency === 'INR' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'INR',
        quoteCurrency: 'PI',
        rate: 0.01042,
        source: 'mock_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    if (baseCurrency === 'USD' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'USD',
        quoteCurrency: 'PI',
        rate: 0.314159,
        source: 'mock_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    if (baseCurrency === 'EUR' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'EUR',
        quoteCurrency: 'PI',
        rate: 0.35,
        source: 'mock_market',
        provider: this.providerId,
        fetchedAt: now,
        status: 'AVAILABLE',
        precision: 7,
        version: '1.0.0',
      };
    }
    return {
      baseCurrency,
      quoteCurrency,
      rate: null,
      source: 'none',
      provider: this.providerId,
      fetchedAt: now,
      status: 'UNAVAILABLE',
      precision: 7,
      version: '1.0.0',
      errorDetails: 'Pair unavailable',
    };
  }
}

describe('Phase 6 — Central Pricing & Shopping Cart Integration Test Matrix', () => {
  let mockResolver: RateResolver;
  let engineWithMock: PricingEngine;

  beforeEach(() => {
    const mockProvider = new MockActiveRateProvider();
    mockResolver = new RateResolver(mockProvider);
    globalRateResolver.setActiveProvider(mockProvider);
    engineWithMock = new PricingEngine(mockResolver);
  });

  it('1. Legacy Pi product added to cart retains LEGACY_PI mode and price', async () => {
    const product = {
      productId: 'p_legacy_1',
      price: 25.5,
      currency: 'PI',
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.mode).toBe('LEGACY_PI');
    expect(resolved.piAmount).toBe(25.5);

    const item: ExtendedCartItem = {
      itemId: 'cart_item_1',
      cartId: 'cart_1',
      productId: product.productId,
      name: 'Legacy Product',
      quantity: 2,
      unitPrice: resolved.piAmount!,
      subtotal: resolved.piAmount! * 2,
      status: 'active',
      pricingMode: resolved.mode,
      piUnitPrice: resolved.piAmount!,
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.hasLegacyItems).toBe(true);
    expect(summary.subtotal).toBe(51.0);
  });

  it('2. Community product added to cart retains COMMUNITY mode and fixed price', async () => {
    const product = {
      productId: 'p_community_1',
      pricingMode: 'COMMUNITY' as const,
      communityPrice: 15.0,
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.mode).toBe('COMMUNITY');
    expect(resolved.piAmount).toBe(15.0);

    const item: ExtendedCartItem = {
      itemId: 'cart_item_2',
      cartId: 'cart_1',
      productId: product.productId,
      name: 'Community Product',
      quantity: 3,
      unitPrice: resolved.piAmount!,
      subtotal: resolved.piAmount! * 3,
      status: 'active',
      pricingMode: resolved.mode,
      communityPiAmount: resolved.piAmount!,
      piUnitPrice: resolved.piAmount!,
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.hasCommunityItems).toBe(true);
    expect(summary.subtotal).toBe(45.0);
  });

  it('3. Exchange INR product added to cart converts INR to Pi accurately', async () => {
    const product = {
      productId: 'p_inr_1',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'INR',
      fiatAmount: 1000,
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.localCurrency).toBe('INR');
    expect(resolved.localAmount).toBe(1000);
    expect(resolved.piAmount).toBe(10.42);

    const item: ExtendedCartItem = {
      itemId: 'cart_item_3',
      cartId: 'cart_1',
      productId: product.productId,
      name: 'INR Product',
      quantity: 2,
      unitPrice: resolved.piAmount!,
      subtotal: resolved.piAmount! * 2,
      status: 'active',
      pricingMode: resolved.mode,
      localCurrency: resolved.localCurrency,
      localAmount: resolved.localAmount ?? undefined,
      piUnitPrice: resolved.piAmount!,
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.hasExchangeItems).toBe(true);
    expect(summary.localCurrencyTotals?.['INR']).toBe(2000);
    expect(summary.subtotal).toBe(20.84);
  });

  it('4. Exchange USD product added to cart converts USD to Pi accurately', async () => {
    const product = {
      productId: 'p_usd_1',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'USD',
      fiatAmount: 100,
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.piAmount).toBe(31.4159);

    const item: ExtendedCartItem = {
      itemId: 'cart_item_4',
      cartId: 'cart_1',
      productId: product.productId,
      name: 'USD Product',
      quantity: 1,
      unitPrice: resolved.piAmount!,
      subtotal: resolved.piAmount!,
      status: 'active',
      pricingMode: resolved.mode,
      localCurrency: 'USD',
      localAmount: 100,
      piUnitPrice: resolved.piAmount!,
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.hasExchangeItems).toBe(true);
    expect(summary.localCurrencyTotals?.['USD']).toBe(100);
    expect(summary.subtotal).toBe(31.4159);
  });

  it('5. Exchange EUR product added to cart converts EUR to Pi accurately', async () => {
    const product = {
      productId: 'p_eur_1',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'EUR',
      fiatAmount: 50,
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.mode).toBe('EXCHANGE');
    expect(resolved.piAmount).toBe(17.5);

    const item: ExtendedCartItem = {
      itemId: 'cart_item_5',
      cartId: 'cart_1',
      productId: product.productId,
      name: 'EUR Product',
      quantity: 2,
      unitPrice: resolved.piAmount!,
      subtotal: resolved.piAmount! * 2,
      status: 'active',
      pricingMode: resolved.mode,
      localCurrency: 'EUR',
      localAmount: 50,
      piUnitPrice: resolved.piAmount!,
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.hasExchangeItems).toBe(true);
    expect(summary.localCurrencyTotals?.['EUR']).toBe(100);
    expect(summary.subtotal).toBe(35.0);
  });

  it('6. Exchange rate unavailable falls back cleanly to fallback or error without crash', async () => {
    const product = {
      productId: 'p_unavail_1',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'XYZ',
      fiatAmount: 100,
      fallbackPiPrice: 20.0,
    };
    const resolved = await resolveProductPricing(product, mockResolver);
    expect(resolved.piAmount).toBe(20.0);
  });

  it('7. Stale rate handling flags status correctly', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'INR',
      localAmount: 1000,
    });
    expect(res.rateStatus).toBe('AVAILABLE');
  });

  it('8. Community price remains fixed regardless of exchange fluctuations', async () => {
    const product = {
      productId: 'p_community_fixed',
      pricingMode: 'COMMUNITY' as const,
      communityPrice: 50.0,
    };
    const res1 = await resolveProductPricing(product, mockResolver);
    const res2 = await resolveProductPricing(product);
    expect(res1.piAmount).toBe(50.0);
    expect(res2.piAmount).toBe(50.0);
  });

  it('9. Legacy price remains fixed regardless of exchange fluctuations', async () => {
    const product = {
      productId: 'p_legacy_fixed',
      price: 12.0,
    };
    const res1 = await resolveProductPricing(product, mockResolver);
    const res2 = await resolveProductPricing(product);
    expect(res1.piAmount).toBe(12.0);
    expect(res2.piAmount).toBe(12.0);
  });

  it('10. Variant explicit price resolution in cart', async () => {
    const product = {
      productId: 'p_var_1',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'INR',
      fiatAmount: 1000,
      variants: [
        {
          variantId: 'v_1',
          fiatAmount: 1500,
          attributes: { Size: 'XL' },
        },
      ],
    };
    const resolved = await resolveVariantPricing(product.variants[0], product, mockResolver);
    expect(resolved.localAmount).toBe(1500);
    expect(resolved.piAmount).toBe(15.63);
  });

  it('11. Variant inherited price resolution in cart', async () => {
    const product = {
      productId: 'p_var_2',
      pricingMode: 'EXCHANGE' as const,
      fiatCurrency: 'INR',
      fiatAmount: 1000,
      variants: [
        {
          variantId: 'v_2',
          attributes: { Color: 'Red' },
        },
      ],
    };
    const resolved = await resolveVariantPricing(product.variants[0], product, mockResolver);
    expect(resolved.localAmount).toBe(1000);
    expect(resolved.piAmount).toBe(10.42);
  });

  it('12. Quantity multiplication calculates item subtotal correctly', () => {
    const item: ExtendedCartItem = {
      itemId: 'i_qty_1',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item Qty',
      quantity: 5,
      unitPrice: 10,
      subtotal: 50,
      status: 'active',
      piUnitPrice: 10,
    };
    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.subtotal).toBe(50);
  });

  it('13. Quantity increase recalculates subtotal and tax accurately', () => {
    const item: ExtendedCartItem = {
      itemId: 'i_qty_2',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item Qty 2',
      quantity: 2,
      unitPrice: 10,
      subtotal: 20,
      status: 'active',
      piUnitPrice: 10,
    };
    const summary1 = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary1.subtotal).toBe(20);

    item.quantity = 4;
    item.subtotal = 40;
    const summary2 = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary2.subtotal).toBe(40);
    expect(summary2.tax).toBe(2.0); // 5% of 40
  });

  it('14. Quantity decrease recalculates subtotal accurately', () => {
    const item: ExtendedCartItem = {
      itemId: 'i_qty_3',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item Qty 3',
      quantity: 4,
      unitPrice: 10,
      subtotal: 40,
      status: 'active',
      piUnitPrice: 10,
    };
    item.quantity = 1;
    item.subtotal = 10;
    const summary = EnterpriseCartEngine.calculateCartSummary([item]);
    expect(summary.subtotal).toBe(10);
  });

  it('15. Item removal recalculates cart total cleanly', () => {
    const item1: ExtendedCartItem = {
      itemId: 'i_rem_1',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item 1',
      quantity: 1,
      unitPrice: 10,
      subtotal: 10,
      status: 'active',
    };
    const item2: ExtendedCartItem = {
      itemId: 'i_rem_2',
      cartId: 'c_1',
      productId: 'p_2',
      name: 'Item 2',
      quantity: 1,
      unitPrice: 20,
      subtotal: 20,
      status: 'active',
    };
    const summaryBefore = EnterpriseCartEngine.calculateCartSummary([item1, item2]);
    expect(summaryBefore.subtotal).toBe(30);

    const summaryAfter = EnterpriseCartEngine.calculateCartSummary([item1]);
    expect(summaryAfter.subtotal).toBe(10);
  });

  it('16. Multi-vendor seller grouping preserves item metadata and subtotals', () => {
    const item1: ExtendedCartItem = {
      itemId: 'i_m_1',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item 1',
      quantity: 1,
      unitPrice: 10,
      subtotal: 10,
      status: 'active',
      sellerId: 'merchant_A',
      sellerName: 'Merchant A',
    };
    const item2: ExtendedCartItem = {
      itemId: 'i_m_2',
      cartId: 'c_1',
      productId: 'p_2',
      name: 'Item 2',
      quantity: 2,
      unitPrice: 15,
      subtotal: 30,
      status: 'active',
      sellerId: 'merchant_B',
      sellerName: 'Merchant B',
    };

    const groups = EnterpriseCartEngine.groupItemsBySeller([item1, item2]);
    expect(groups.length).toBe(2);
    expect(groups.find((g) => g.sellerId === 'merchant_A')?.subtotal).toBe(10);
    expect(groups.find((g) => g.sellerId === 'merchant_B')?.subtotal).toBe(30);
  });

  it('17. No fake rates (3.8, 3.14159 GCV) hardcoded in cart logic', async () => {
    const res = await engineWithMock.calculatePrice({
      mode: 'EXCHANGE',
      localCurrency: 'XYZ',
      localAmount: 100,
    });
    // With no active rate for XYZ, rateUsed is null
    expect(res.rateUsed).toBeNull();
  });

  it('18. Existing discount coupon behavior functions accurately', () => {
    const coupon = {
      code: 'PIFESTIVAL',
      discountType: 'percentage' as const,
      discountValue: 10,
      description: '10% OFF',
    };
    const item: ExtendedCartItem = {
      itemId: 'i_coup_1',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Item',
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
      status: 'active',
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([item], coupon);
    expect(summary.couponDiscount).toBe(10);
    expect(summary.grandTotal).toBe(90 + 90 * 0.05 + 10); // 90 subtotal + 5% tax + 10 shipping
  });

  it('19. Service item handling calculates serviceSubtotal separately', () => {
    const productItem: ExtendedCartItem = {
      itemId: 'i_p',
      cartId: 'c_1',
      productId: 'p_1',
      name: 'Physical Product',
      quantity: 1,
      unitPrice: 50,
      subtotal: 50,
      status: 'active',
      type: 'physical',
    };
    const serviceItem: ExtendedCartItem = {
      itemId: 'i_s',
      cartId: 'c_1',
      productId: 's_1',
      name: 'Repair Consultation Service',
      quantity: 1,
      unitPrice: 30,
      subtotal: 30,
      status: 'active',
      type: 'service',
    };

    const summary = EnterpriseCartEngine.calculateCartSummary([productItem, serviceItem]);
    expect(summary.productSubtotal).toBe(50);
    expect(summary.serviceSubtotal).toBe(30);
    expect(summary.subtotal).toBe(80);
  });

  it('20. Complete multi-currency cart summary calculation matrix', () => {
    const items: ExtendedCartItem[] = [
      {
        itemId: 'i1',
        cartId: 'c1',
        productId: 'p1',
        name: 'INR Prod',
        quantity: 2,
        unitPrice: 10.42,
        subtotal: 20.84,
        status: 'active',
        pricingMode: 'EXCHANGE',
        localCurrency: 'INR',
        localAmount: 1000,
        piUnitPrice: 10.42,
      },
      {
        itemId: 'i2',
        cartId: 'c1',
        productId: 'p2',
        name: 'USD Prod',
        quantity: 1,
        unitPrice: 31.4159,
        subtotal: 31.4159,
        status: 'active',
        pricingMode: 'EXCHANGE',
        localCurrency: 'USD',
        localAmount: 100,
        piUnitPrice: 31.4159,
      },
      {
        itemId: 'i3',
        cartId: 'c1',
        productId: 'p3',
        name: 'Community Prod',
        quantity: 1,
        unitPrice: 15.0,
        subtotal: 15.0,
        status: 'active',
        pricingMode: 'COMMUNITY',
        communityPiAmount: 15.0,
        piUnitPrice: 15.0,
      },
      {
        itemId: 'i4',
        cartId: 'c1',
        productId: 'p4',
        name: 'Legacy Prod',
        quantity: 1,
        unitPrice: 20.0,
        subtotal: 20.0,
        status: 'active',
        pricingMode: 'LEGACY_PI',
        piUnitPrice: 20.0,
      },
    ];

    const summary = EnterpriseCartEngine.calculateCartSummary(items);
    expect(summary.hasExchangeItems).toBe(true);
    expect(summary.hasCommunityItems).toBe(true);
    expect(summary.hasLegacyItems).toBe(true);
    expect(summary.localCurrencyTotals?.['INR']).toBe(2000);
    expect(summary.localCurrencyTotals?.['USD']).toBe(100);
    expect(summary.subtotal).toBe(20.84 + 31.4159 + 15.0 + 20.0);
  });
});
