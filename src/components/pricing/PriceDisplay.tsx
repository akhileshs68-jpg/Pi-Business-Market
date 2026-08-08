/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Clock } from 'lucide-react';
import { 
  resolveProductPricing, 
  resolveServicePricing, 
  resolveVariantPricing,
  ResolvedPricing 
} from '../../services/pricing/pricingCompatibility';
import { formatCurrencyAmount } from '../../services/pricing/currencyRegistry';

export interface PriceDisplayProps {
  item?: any;
  parentProduct?: any;
  pricingResult?: ResolvedPricing;
  type?: 'product' | 'service' | 'variant';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'compact' | 'stacked' | 'inline';
  className?: string;
  showBadges?: boolean;
  showRateStatus?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  item,
  parentProduct,
  pricingResult: propPricingResult,
  type = 'product',
  size = 'md',
  layout = 'stacked',
  className = '',
  showBadges = true,
  showRateStatus = true,
}) => {
  const [resolved, setResolved] = useState<ResolvedPricing | null>(propPricingResult || null);

  useEffect(() => {
    if (propPricingResult) {
      setResolved(propPricingResult);
      return;
    }

    if (!item) {
      setResolved(null);
      return;
    }

    let isMounted = true;

    const resolvePrice = async () => {
      try {
        let res: ResolvedPricing;
        if (type === 'variant' && parentProduct) {
          res = await resolveVariantPricing(item, parentProduct);
        } else if (type === 'service' || item.serviceId || item.serviceName) {
          res = await resolveServicePricing(item);
        } else {
          res = await resolveProductPricing(item);
        }

        if (isMounted) {
          setResolved(res);
        }
      } catch (err) {
        console.error('Failed to resolve price in PriceDisplay:', err);
        if (isMounted) {
          setResolved({
            mode: 'LEGACY_PI',
            isLegacy: true,
            piAmount: Number(item.price || item.basePrice || 0),
            localCurrency: 'PI',
            localAmount: null,
            rateUsed: null,
            rateSource: 'none',
            rateProvider: 'none',
            rateTimestamp: null,
            rateStatus: 'UNAVAILABLE',
          });
        }
      }
    };

    resolvePrice();

    return () => {
      isMounted = false;
    };
  }, [item, parentProduct, propPricingResult, type]);

  // Fallback while loading initial resolution
  if (!resolved) {
    const fallbackPrice = item ? Number(item.price || item.basePrice || 0) : 0;
    return (
      <div className={`inline-flex items-baseline gap-1 animate-pulse ${className}`}>
        <span className={`font-mono font-black text-white ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-4xl' : 'text-base'}`}>
          {fallbackPrice}
        </span>
        <span className="text-violet-400 font-black text-xs">π</span>
      </div>
    );
  }

  // Sizing definitions
  const fontSizeClass = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl',
  }[size];

  const subFontSizeClass = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  // Helper for service billing intervals
  const serviceInterval = item?.pricingType && item.pricingType !== 'fixed' && item.pricingType !== 'quote'
    ? ` / ${item.pricingType}`
    : '';

  // 1. EXCHANGE MODE
  if (resolved.mode === 'EXCHANGE' && resolved.localAmount !== null && resolved.localCurrency) {
    const formattedLocal = formatCurrencyAmount(resolved.localAmount, resolved.localCurrency);

    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          {/* Main Local Fiat Amount */}
          <span className={`font-mono font-black text-white ${fontSizeClass}`}>
            {formattedLocal}
            {serviceInterval}
          </span>

          {/* Calculated Pi Equivalent */}
          {resolved.rateStatus !== 'UNAVAILABLE' && resolved.piAmount !== null ? (
            <span className={`font-mono font-bold text-violet-300 flex items-center gap-0.5 ${subFontSizeClass}`}>
              <span>≈ {resolved.piAmount}</span>
              <span className="font-black">π</span>
            </span>
          ) : (
            <span className={`text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ${subFontSizeClass}`}>
              Pi rate unavailable
            </span>
          )}
        </div>

        {/* Rate Status Indicators */}
        {showRateStatus && (
          <div className="flex items-center gap-1 mt-0.5">
            {resolved.rateStatus === 'AVAILABLE' && (
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live rate
              </span>
            )}
            {resolved.rateStatus === 'STALE' && (
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Rate updating
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. COMMUNITY MODE
  if (resolved.mode === 'COMMUNITY') {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`font-mono font-black text-white ${fontSizeClass}`}>
            {resolved.piAmount ?? 0}
          </span>
          <span className="text-violet-400 font-black text-xs">π</span>
          {serviceInterval && <span className="text-slate-400 text-xs font-semibold">{serviceInterval}</span>}
        </div>

        {showBadges && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="px-1.5 py-0.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded text-[8px] font-black uppercase tracking-wider">
              Community Price
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. LEGACY PI MODE
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className={`font-mono font-black text-white ${fontSizeClass}`}>
          {resolved.piAmount ?? 0}
        </span>
        <span className="text-violet-400 font-black text-xs">π</span>
        {serviceInterval && <span className="text-slate-400 text-xs font-semibold">{serviceInterval}</span>}
      </div>
    </div>
  );
};
