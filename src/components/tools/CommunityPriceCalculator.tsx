/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  HelpCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { 
  getSupportedCurrencies, 
  getCurrencySymbol, 
  formatCurrencyAmount 
} from '../../services/pricing/currencyRegistry';
import { 
  calculateCommunityPrice, 
  CommunityPriceCalculationResult,
  COMMUNITY_CALCULATOR_DISCLAIMER,
  COMMUNITY_EXCHANGE_SEPARATION_NOTE
} from '../../services/pricing/communityPriceCalculator';

export interface CommunityPriceCalculatorProps {
  onSelectPrice?: (piAmount: number, details?: { mode: 'COMMUNITY'; localCurrency?: string; localAmount?: number }) => void;
  targetLabel?: string;
  initialCurrency?: string;
  initialAmount?: number;
  className?: string;
}

export const CommunityPriceCalculatorUI: React.FC<CommunityPriceCalculatorProps> = ({
  onSelectPrice,
  targetLabel = 'Seller Form',
  initialCurrency = 'INR',
  initialAmount,
  className = '',
}) => {
  const currencies = getSupportedCurrencies().filter(c => c.code !== 'PI');
  
  const [mode, setMode] = useState<'DERIVED' | 'DIRECT'>('DERIVED');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    currencies.some(c => c.code === initialCurrency) ? initialCurrency : 'INR'
  );
  const [referenceAmount, setReferenceAmount] = useState<string>(
    initialAmount && initialAmount > 0 ? String(initialAmount) : ''
  );
  const [userDefinedPiRef, setUserDefinedPiRef] = useState<string>('');
  const [directPiAmount, setDirectPiAmount] = useState<string>('');

  const [calculationResult, setCalculationResult] = useState<CommunityPriceCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCalculate = () => {
    setValidationError(null);

    const res = calculateCommunityPrice({
      mode,
      referenceCurrency: selectedCurrency,
      referenceAmount,
      userDefinedPiReference: userDefinedPiRef,
      directCommunityPiAmount: directPiAmount,
    });

    if (!res.success) {
      setValidationError(res.error || 'Invalid calculation inputs.');
      setCalculationResult(null);
    } else {
      setCalculationResult(res);
    }
  };

  const handleReset = () => {
    setReferenceAmount('');
    setUserDefinedPiRef('');
    setDirectPiAmount('');
    setCalculationResult(null);
    setValidationError(null);
  };

  const currentSymbol = getCurrencySymbol(selectedCurrency);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Community Price Calculator</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Decision-Support Tool for Pioneers & Sellers
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMode('DERIVED');
              setCalculationResult(null);
              setValidationError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              mode === 'DERIVED'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Derived Valuation
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('DIRECT');
              setCalculationResult(null);
              setValidationError(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              mode === 'DIRECT'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Community Price
          </button>
        </div>
      </div>

      {/* Disclaimers & Info Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-start gap-2 text-violet-300 font-semibold">
          <Info className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
          <span>{COMMUNITY_CALCULATOR_DISCLAIMER}</span>
        </div>
        <div className="flex items-start gap-2 text-slate-400 text-[11px] pl-6 border-l border-slate-800">
          <span>{COMMUNITY_EXCHANGE_SEPARATION_NOTE}</span>
        </div>
      </div>

      {/* Mode 1: Derived Mode Inputs */}
      {mode === 'DERIVED' && (
        <div className="grid sm:grid-cols-3 gap-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/60">
          {/* Reference Currency */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Reference Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.displayName} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Reference Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Reference Value ({currentSymbol})
            </label>
            <input
              type="number"
              min={0.01}
              step="any"
              placeholder={`e.g. 1000`}
              value={referenceAmount}
              onChange={(e) => setReferenceAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold text-white placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* User-Defined Pi Reference Value */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              User-Defined Pi Reference ({currentSymbol} / π)
            </label>
            <input
              type="number"
              min={0.000001}
              step="any"
              placeholder={`e.g. 100`}
              value={userDefinedPiRef}
              onChange={(e) => setUserDefinedPiRef(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold text-white placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Mode 2: Direct Mode Input */}
      {mode === 'DIRECT' && (
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/60 space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Direct Community Pi Price (π)
          </label>
          <input
            type="number"
            min={0.0000001}
            step="any"
            placeholder="e.g. 25"
            value={directPiAmount}
            onChange={(e) => setDirectPiAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-slate-600 outline-none focus:border-violet-500 transition-colors max-w-md"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCalculate}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
          Calculate
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Error Message */}
      {validationError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-xs font-bold animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Calculation Result Display */}
      {calculationResult && calculationResult.success && calculationResult.communityPiAmount !== null && (
        <div className="bg-gradient-to-br from-violet-950/40 via-slate-950 to-indigo-950/30 border border-violet-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-500/20 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 block">
                Calculated Community Reference
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-black text-white">
                  {calculationResult.communityPiAmount}
                </span>
                <span className="text-violet-400 font-black text-lg">π</span>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
              User-Defined Valuation
            </span>
          </div>

          {calculationResult.mode === 'DERIVED' && (
            <div className="text-xs text-slate-400 space-y-1">
              <p>
                Reference Value: <span className="text-white font-bold">{formatCurrencyAmount(calculationResult.referenceAmount || 0, calculationResult.referenceCurrency)}</span>
              </p>
              <p>
                User-Defined Ratio: <span className="text-white font-bold">{getCurrencySymbol(calculationResult.referenceCurrency)}{calculationResult.userDefinedPiReference} / π</span>
              </p>
            </div>
          )}

          {/* Transfer / Use Price Action */}
          {onSelectPrice && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (calculationResult.communityPiAmount !== null) {
                    onSelectPrice(calculationResult.communityPiAmount, {
                      mode: 'COMMUNITY',
                      localCurrency: calculationResult.referenceCurrency,
                      localAmount: calculationResult.referenceAmount,
                    });
                  }
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Use This Community Price {targetLabel ? `(${targetLabel})` : ''}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
