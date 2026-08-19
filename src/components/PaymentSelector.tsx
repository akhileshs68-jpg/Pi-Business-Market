import React from 'react';
import { PAYMENT_PROVIDERS } from '../config/paymentProviders';
import { PaymentMethodId } from '../types/payment';
import { Check, ShieldCheck } from 'lucide-react';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
  disabled?: boolean;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({ selectedMethod, onSelect, disabled }) => {
  return (
    <div className="space-y-4" role="radiogroup" aria-label="Select Payment Method">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Available Payment Methods</h3>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Direct Pi Consensus
        </span>
      </div>
      <div className="grid gap-3">
        {PAYMENT_PROVIDERS.filter(p => p.enabled).map((provider) => {
          const isSelected = selectedMethod === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(provider.id)}
              className={`w-full min-h-[56px] flex items-center p-4 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isSelected
                  ? 'bg-violet-600/15 border-violet-500 shadow-md shadow-violet-600/10'
                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors ${
                isSelected ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-slate-850 text-slate-400 border border-slate-800'
              }`}>
                <span className="text-xs font-black tracking-wider">{provider.id.slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {provider.name}
                  </h4>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded-full border border-violet-800/80 shrink-0">
                      Selected
                    </span>
                  )}
                </div>
                {provider.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">{provider.description}</p>
                )}
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                isSelected 
                  ? 'bg-violet-600 border-violet-500 text-white' 
                  : 'border-slate-700 bg-slate-900 text-transparent'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

