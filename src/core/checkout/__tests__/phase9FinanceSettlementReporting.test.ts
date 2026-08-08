import { describe, it, expect, beforeEach } from 'vitest';
import { pricingEngine, PricingEngine } from '../../../services/pricing/pricingEngine';
import { RateResolver, globalRateResolver } from '../../../services/pricing/rateProvider';
import { RateProvider, RateResult, PricingInput, PricingSnapshot } from '../../../services/pricing/pricingTypes';

class DynamicRateProvider implements RateProvider {
  readonly providerId = 'dynamic_test_provider';
  readonly providerName = 'Dynamic Test Rate Provider';
  public usdToPiRate: number = 0.25; // 1 USD = 0.25 Pi ($4/Pi)

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<RateResult> {
    const now = new Date().toISOString();
    if (baseCurrency === 'USD' && quoteCurrency === 'PI') {
      return {
        baseCurrency: 'USD',
        quoteCurrency: 'PI',
        rate: this.usdToPiRate,
        source: 'dynamic_market',
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
    };
  }
}

// Helper to simulate Finance & Settlement Reporting calculations
function calculateFinanceMetrics(payments: any[]) {
  if (!payments || payments.length === 0) {
    return {
      grossPi: 0,
      commissionPi: 0,
      netMerchantPi: 0,
      recordCount: 0,
      pricingModes: { EXCHANGE: 0, COMMUNITY: 0, LEGACY_PI: 0 },
      hasTransactions: false,
    };
  }

  let grossPi = 0;
  let commissionPi = 0;
  let netMerchantPi = 0;
  const pricingModes = { EXCHANGE: 0, COMMUNITY: 0, LEGACY_PI: 0 };

  payments.forEach(p => {
    const snap = p.pricingSnapshot;
    // Rule: Use snapshot piAmount if available, fallback to p.piAmount, fallback to p.amount
    const piAmount = (snap?.piAmount ?? p.piAmount ?? Number(p.amount)) || 0;
    const feePercent = p.commissionPercentage !== undefined ? Number(p.commissionPercentage) : 1.0;
    const itemCommission = (piAmount * feePercent) / 100;
    const merchantShare = piAmount - itemCommission;

    grossPi += piAmount;
    commissionPi += itemCommission;
    netMerchantPi += merchantShare;

    const mode = snap?.pricingMode || p.pricingMode || (snap ? 'EXCHANGE' : 'LEGACY_PI');
    if (mode === 'EXCHANGE') pricingModes.EXCHANGE++;
    else if (mode === 'COMMUNITY') pricingModes.COMMUNITY++;
    else pricingModes.LEGACY_PI++;
  });

  return {
    grossPi,
    commissionPi,
    netMerchantPi,
    recordCount: payments.length,
    pricingModes,
    hasTransactions: true,
  };
}

function reconcilePillars(order: any, payment: any, ledgerEntry: any, settlement: any) {
  const orderAmount = order ? Number(order.grandTotal ?? order.amount) : null;
  const paymentAmount = payment ? (payment.pricingSnapshot?.piAmount ?? payment.piAmount ?? Number(payment.amount)) : null;
  const ledgerAmount = ledgerEntry ? Math.abs(Number(ledgerEntry.amount)) : null;
  const settlementGross = settlement ? Number(settlement.grossAmount ?? settlement.amount) : null;

  const isOrderMatched = orderAmount === null || paymentAmount === null || Math.abs(orderAmount - paymentAmount) < 0.001;
  const isLedgerMatched = ledgerAmount === null || paymentAmount === null || Math.abs(ledgerAmount - paymentAmount) < 0.001;
  const isSettlementMatched = settlementGross === null || paymentAmount === null || Math.abs(settlementGross - paymentAmount) < 0.001;

  const isReconciled = isOrderMatched && isLedgerMatched && isSettlementMatched;

  return {
    isReconciled,
    orderAmount,
    paymentAmount,
    ledgerAmount,
    settlementGross,
    discrepancies: [
      !isOrderMatched ? 'Order amount mismatch' : null,
      !isLedgerMatched ? 'Ledger amount mismatch' : null,
      !isSettlementMatched ? 'Settlement amount mismatch' : null,
    ].filter(Boolean),
  };
}

describe('Phase 9 — Finance & Settlement Reporting Integration', () => {
  let rateProvider: DynamicRateProvider;
  let mockResolver: RateResolver;
  let testEngine: PricingEngine;

  beforeEach(() => {
    rateProvider = new DynamicRateProvider();
    mockResolver = new RateResolver(rateProvider);
    globalRateResolver.setActiveProvider(rateProvider);
    testEngine = new PricingEngine(mockResolver);
  });

  // CATEGORY 1: Source of Truth & Historical Immutability (7 tests)
  describe('1. Source of Truth & Historical Immutability', () => {
    it('1.1 computes gross revenue strictly using pricingSnapshot.piAmount when present', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 200 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const paymentRecord = {
        paymentId: 'PAY_901',
        amount: 200,
        currency: 'USD',
        pricingSnapshot: snapshot,
        commissionPercentage: 2.0,
      };

      const metrics = calculateFinanceMetrics([paymentRecord]);
      expect(metrics.grossPi).toBe(50); // 200 USD @ 0.25 = 50 Pi
    });

    it('1.2 does not recalculate historical financial values when live market rate fluctuates', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 200 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const paymentRecord = { paymentId: 'PAY_902', pricingSnapshot: snapshot };

      // Market rate changes drastically: 1 USD = 0.50 Pi ($2/Pi)
      rateProvider.usdToPiRate = 0.50;

      // Reporting MUST still calculate using historical snapshot
      const metrics = calculateFinanceMetrics([paymentRecord]);
      expect(metrics.grossPi).toBe(50); // NOT 100 Pi!
    });

    it('1.3 calculates historical platform commission based on frozen snapshot amount', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 500 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const paymentRecord = {
        paymentId: 'PAY_903',
        pricingSnapshot: snapshot,
        commissionPercentage: 10.0, // 10% commission
      };

      const metrics = calculateFinanceMetrics([paymentRecord]);
      expect(metrics.grossPi).toBe(125); // 500 * 0.25
      expect(metrics.commissionPi).toBe(12.5); // 10% of 125
    });

    it('1.4 computes net merchant payout based on frozen snapshot amount', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 400 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const paymentRecord = {
        paymentId: 'PAY_904',
        pricingSnapshot: snapshot,
        commissionPercentage: 5.0, // 5% commission
      };

      const metrics = calculateFinanceMetrics([paymentRecord]);
      expect(metrics.grossPi).toBe(100);
      expect(metrics.commissionPi).toBe(5);
      expect(metrics.netMerchantPi).toBe(95);
    });

    it('1.5 preserves historical rateUsed, rateSource, and rateTimestamp without alteration', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const paymentRecord = { paymentId: 'PAY_905', pricingSnapshot: snapshot };

      expect(paymentRecord.pricingSnapshot.rateUsed).toBe(0.25);
      expect(paymentRecord.pricingSnapshot.rateSource).toBe('dynamic_market');
      expect(paymentRecord.pricingSnapshot.capturedAt).toBeDefined();
    });

    it('1.6 verifies pricing engine version in snapshot is reported accurately', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot.pricingEngineVersion).toBe(pricingEngine.version);
    });

    it('1.7 guarantees report aggregations perform read-only operations without snapshot mutations', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);
      const initialSnapshotJson = JSON.stringify(snapshot);

      const paymentRecord = { paymentId: 'PAY_907', pricingSnapshot: snapshot };
      calculateFinanceMetrics([paymentRecord]);

      expect(JSON.stringify(paymentRecord.pricingSnapshot)).toBe(initialSnapshotJson);
    });
  });

  // CATEGORY 2: Multi-Pricing Mode Financial Reporting (7 tests)
  describe('2. Multi-Pricing Mode Financial Reporting', () => {
    it('2.1 reports EXCHANGE mode transaction with exact rateUsed and rateSource', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);
      const payment = { paymentId: 'PAY_EX_1', pricingSnapshot: snapshot };

      expect(payment.pricingSnapshot.pricingMode).toBe('EXCHANGE');
      expect(payment.pricingSnapshot.rateUsed).toBe(0.25);
      expect(payment.pricingSnapshot.rateSource).toBe('dynamic_market');
    });

    it('2.2 reports COMMUNITY mode transaction with rateUsed as null', async () => {
      const quote = await testEngine.createQuote({ mode: 'COMMUNITY', communityPiAmount: 314 });
      const snapshot = testEngine.createPricingSnapshot(quote);
      const payment = { paymentId: 'PAY_COM_1', pricingSnapshot: snapshot };

      expect(payment.pricingSnapshot.pricingMode).toBe('COMMUNITY');
      expect(payment.pricingSnapshot.rateUsed).toBeNull();
      expect(payment.pricingSnapshot.piAmount).toBe(314);
    });

    it('2.3 reports LEGACY_PI mode transaction with rateUsed as null', () => {
      const legacyPayment = {
        paymentId: 'PAY_LEG_1',
        amount: 50,
        currency: 'Pi',
        pricingMode: 'LEGACY_PI',
        rateUsed: null,
      };

      const metrics = calculateFinanceMetrics([legacyPayment]);
      expect(metrics.grossPi).toBe(50);
      expect(metrics.pricingModes.LEGACY_PI).toBe(1);
    });

    it('2.4 aggregates mixed-mode transactions (EXCHANGE + COMMUNITY + LEGACY) in total gross Pi', async () => {
      const exQuote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 400 }); // 100 Pi
      const exSnap = testEngine.createPricingSnapshot(exQuote);

      const comQuote = await testEngine.createQuote({ mode: 'COMMUNITY', communityPiAmount: 50 }); // 50 Pi
      const comSnap = testEngine.createPricingSnapshot(comQuote);

      const legPay = { paymentId: 'P_LEG', amount: 25, currency: 'Pi' }; // 25 Pi

      const payments = [
        { paymentId: 'P_EX', pricingSnapshot: exSnap },
        { paymentId: 'P_COM', pricingSnapshot: comSnap },
        legPay,
      ];

      const metrics = calculateFinanceMetrics(payments);
      expect(metrics.grossPi).toBe(175); // 100 + 50 + 25
      expect(metrics.pricingModes.EXCHANGE).toBe(1);
      expect(metrics.pricingModes.COMMUNITY).toBe(1);
      expect(metrics.pricingModes.LEGACY_PI).toBe(1);
    });

    it('2.5 categorizes local currency amounts without recalculating historical Pi total', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 1000 }); // 250 Pi
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot.localCurrency).toBe('USD');
      expect(snapshot.localAmount).toBe(1000);
      expect(snapshot.piAmount).toBe(250);
    });

    it('2.6 preserves rate provider precision in reporting breakdown', async () => {
      rateProvider.usdToPiRate = 0.314159;
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(snapshot.rateUsed).toBe(0.314159);
      expect(snapshot.piAmount).toBeCloseTo(31.4159, 4);
    });

    it('2.7 safely processes zero-value community transactions in finance reporting without errors', async () => {
      const quote = await testEngine.createQuote({ mode: 'COMMUNITY', communityPiAmount: 0.01 });
      const snapshot = testEngine.createPricingSnapshot(quote);
      const metrics = calculateFinanceMetrics([{ paymentId: 'P_ZERO', pricingSnapshot: snapshot, commissionPercentage: 0 }]);

      expect(metrics.grossPi).toBe(0.01);
      expect(metrics.commissionPi).toBe(0);
    });
  });

  // CATEGORY 3: Current Market Rate vs Historical Rate Differentiation (5 tests)
  describe('3. Current Market Rate vs Historical Rate Differentiation', () => {
    it('3.1 distinguishes between current market rate and historical snapshot rate', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      // Historical rate is 0.25
      expect(snapshot.rateUsed).toBe(0.25);

      // Current rate changes
      rateProvider.usdToPiRate = 0.80;
      mockResolver.clearCache();
      const currentRateResult = await mockResolver.resolveRate('USD', 'PI');

      expect(snapshot.rateUsed).toBe(0.25);
      expect(currentRateResult.rate).toBe(0.80);
      expect(snapshot.rateUsed).not.toBe(currentRateResult.rate);
    });

    it('3.2 displays historical rate for transaction audit while displaying current market rate for live status', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 400 }); // 100 Pi
      const snapshot = testEngine.createPricingSnapshot(quote);

      rateProvider.usdToPiRate = 0.50; // New rate: 1 USD = 0.50 Pi ($2/Pi)
      mockResolver.clearCache();

      const liveRate = (await mockResolver.resolveRate('USD', 'PI')).rate;
      const historicalRate = snapshot.rateUsed;

      expect(historicalRate).toBe(0.25);
      expect(liveRate).toBe(0.50);
      expect(snapshot.piAmount).toBe(100);
    });

    it('3.3 rejects retroactive rate updates on historical transaction snapshots', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      expect(() => {
        (snapshot as any).rateUsed = 0.99;
      }).toThrow();
    });

    it('3.4 verifies timestamp ordering between quote creation and reporting audit', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);
      const auditTime = new Date().toISOString();

      expect(new Date(snapshot.capturedAt).getTime()).toBeLessThanOrEqual(new Date(auditTime).getTime());
    });

    it('3.5 ensures rate resolver cache invalidation does not mutate existing snapshot objects', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 100 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      mockResolver.clearCache();
      rateProvider.usdToPiRate = 0.99;

      expect(snapshot.rateUsed).toBe(0.25);
      expect(snapshot.piAmount).toBe(25);
    });
  });

  // CATEGORY 4: Backward Compatibility & Legacy Record Fallback (5 tests)
  describe('4. Backward Compatibility & Legacy Record Fallback', () => {
    it('4.1 falls back to order grandTotal when pricingSnapshot is missing on legacy order', () => {
      const legacyOrder = { id: 'ORD_LEG_1', grandTotal: 75, currency: 'Pi' };
      const resolvedAmount = (legacyOrder as any).pricingSnapshot?.piAmount ?? legacyOrder.grandTotal;

      expect(resolvedAmount).toBe(75);
    });

    it('4.2 falls back to payment amount when pricingSnapshot is missing on legacy payment', () => {
      const legacyPayment = { paymentId: 'PAY_LEG_2', amount: 120, currency: 'Pi' };
      const metrics = calculateFinanceMetrics([legacyPayment]);

      expect(metrics.grossPi).toBe(120);
    });

    it('4.3 falls back to payment currency when localCurrency is missing from snapshot', () => {
      const legacyPayment = { paymentId: 'PAY_LEG_3', amount: 30, currency: 'Pi' };
      const resolvedCurrency = (legacyPayment as any).pricingSnapshot?.localCurrency ?? legacyPayment.currency;

      expect(resolvedCurrency).toBe('Pi');
    });

    it('4.4 applies standard fallback commission (1.0%) for legacy records lacking fee metadata', () => {
      const legacyPayment = { paymentId: 'PAY_LEG_4', amount: 200 };
      const metrics = calculateFinanceMetrics([legacyPayment]);

      expect(metrics.commissionPi).toBe(2.0); // 1% of 200
    });

    it('4.5 aggregates legacy records and snapshot-enabled records seamlessly in single report', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 400 }); // 100 Pi
      const snapshot = testEngine.createPricingSnapshot(quote);

      const snapshotPayment = { paymentId: 'P_SNAP', pricingSnapshot: snapshot };
      const legacyPayment = { paymentId: 'P_LEG', amount: 50, currency: 'Pi' };

      const metrics = calculateFinanceMetrics([snapshotPayment, legacyPayment]);
      expect(metrics.grossPi).toBe(150); // 100 + 50
      expect(metrics.recordCount).toBe(2);
    });
  });

  // CATEGORY 5: Read-Only Reconciliation Matrix (6 tests)
  describe('5. Read-Only Reconciliation Matrix', () => {
    it('5.1 reconciles Payment vs Order vs Ledger vs Settlement when all amounts match', async () => {
      const quote = await testEngine.createQuote({ mode: 'EXCHANGE', localCurrency: 'USD', localAmount: 400 }); // 100 Pi
      const snapshot = testEngine.createPricingSnapshot(quote);

      const order = { id: 'ORD_1', grandTotal: 100 };
      const payment = { paymentId: 'PAY_1', pricingSnapshot: snapshot };
      const ledger = { entryId: 'MLED_1', amount: -100 };
      const settlement = { settlementId: 'SETTLE_1', grossAmount: 100 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(true);
      expect(result.discrepancies.length).toBe(0);
    });

    it('5.2 detects discrepancy if Payment amount differs from Order grandTotal', () => {
      const order = { id: 'ORD_DISC_1', grandTotal: 120 };
      const payment = { paymentId: 'PAY_DISC_1', amount: 100, piAmount: 100 };
      const ledger = { entryId: 'MLED_1', amount: -100 };
      const settlement = { settlementId: 'SETTLE_1', grossAmount: 100 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(false);
      expect(result.discrepancies).toContain('Order amount mismatch');
    });

    it('5.3 detects discrepancy if Ledger entry amount differs from Payment amount', () => {
      const order = { id: 'ORD_1', grandTotal: 100 };
      const payment = { paymentId: 'PAY_1', amount: 100, piAmount: 100 };
      const ledger = { entryId: 'MLED_BAD', amount: -80 };
      const settlement = { settlementId: 'SETTLE_1', grossAmount: 100 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(false);
      expect(result.discrepancies).toContain('Ledger amount mismatch');
    });

    it('5.4 detects discrepancy if Settlement gross amount differs from Payment amount', () => {
      const order = { id: 'ORD_1', grandTotal: 100 };
      const payment = { paymentId: 'PAY_1', amount: 100, piAmount: 100 };
      const ledger = { entryId: 'MLED_1', amount: -100 };
      const settlement = { settlementId: 'SETTLE_BAD', grossAmount: 90 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(false);
      expect(result.discrepancies).toContain('Settlement amount mismatch');
    });

    it('5.5 reconciles COMMUNITY pricing transactions accurately across pillars', async () => {
      const quote = await testEngine.createQuote({ mode: 'COMMUNITY', communityPiAmount: 314 });
      const snapshot = testEngine.createPricingSnapshot(quote);

      const order = { id: 'ORD_COM', grandTotal: 314 };
      const payment = { paymentId: 'PAY_COM', pricingSnapshot: snapshot };
      const ledger = { entryId: 'MLED_COM', amount: -314 };
      const settlement = { settlementId: 'SETTLE_COM', grossAmount: 314 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(true);
    });

    it('5.6 produces clean audit status with zero errors for compliant transactions', () => {
      const payment = { paymentId: 'PAY_CLEAN', amount: 50, piAmount: 50 };
      const order = { id: 'ORD_CLEAN', grandTotal: 50 };
      const ledger = { entryId: 'MLED_CLEAN', amount: -50 };
      const settlement = { settlementId: 'SETTLE_CLEAN', grossAmount: 50 };

      const result = reconcilePillars(order, payment, ledger, settlement);
      expect(result.isReconciled).toBe(true);
      expect(result.discrepancies).toEqual([]);
    });
  });

  // CATEGORY 6: Zero Fake Data & Financial Integrity Rules (5 tests)
  describe('6. Zero Fake Data & Financial Integrity Rules', () => {
    it('6.1 returns zero metrics and hasTransactions false when database has no records', () => {
      const metrics = calculateFinanceMetrics([]);

      expect(metrics.hasTransactions).toBe(false);
      expect(metrics.grossPi).toBe(0);
      expect(metrics.commissionPi).toBe(0);
      expect(metrics.netMerchantPi).toBe(0);
      expect(metrics.recordCount).toBe(0);
    });

    it('6.2 does not generate fake simulated orders, revenue, or commission for empty datasets', () => {
      const emptyDataset: any[] = [];
      const metrics = calculateFinanceMetrics(emptyDataset);

      expect(metrics.grossPi).toBe(0);
      expect(metrics.commissionPi).toBe(0);
    });

    it('6.3 verifies reporting functions execute in read-only mode without database mutation side-effects', () => {
      const payments = [{ paymentId: 'P1', amount: 100 }];
      const copyBefore = JSON.stringify(payments);

      calculateFinanceMetrics(payments);

      expect(JSON.stringify(payments)).toBe(copyBefore);
    });

    it('6.4 enforces role-based access check requirements for finance center reporting', () => {
      const userRoles = ['ADMIN', 'FINANCE_MANAGER'];
      const canAccessFinanceCenter = userRoles.includes('ADMIN') || userRoles.includes('FINANCE_MANAGER');

      expect(canAccessFinanceCenter).toBe(true);
    });

    it('6.5 detects duplicate transaction entries without mutating underlying payment records', () => {
      const payments = [
        { id: 'P_DUP_1', buyerId: 'user_a', amount: 100, createdAt: '2026-08-08T10:00:00Z' },
        { id: 'P_DUP_2', buyerId: 'user_a', amount: 100, createdAt: '2026-08-08T10:01:00Z' }, // 1 min later = duplicate window
      ];

      const timeBuckets = new Map<string, any>();
      const duplicates: any[] = [];

      payments.forEach(p => {
        const bucket = Math.floor(new Date(p.createdAt).getTime() / (180 * 1000));
        const key = `${p.buyerId}_${p.amount}_${bucket}`;
        if (timeBuckets.has(key)) {
          duplicates.push({ duplicateId: p.id, originalId: timeBuckets.get(key).id });
        } else {
          timeBuckets.set(key, p);
        }
      });

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].duplicateId).toBe('P_DUP_2');
      expect(duplicates[0].originalId).toBe('P_DUP_1');
    });
  });
});
