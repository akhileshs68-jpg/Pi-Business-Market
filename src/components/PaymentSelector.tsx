import React from 'react';
import { PAYMENT_PROVIDERS } from '../config/paymentProviders';
import { PaymentMethodId } from '../types/payment';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
  disabled?: boolean;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({ selectedMethod, onSelect, disabled }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">Select Payment Method</h3>
      <div className="grid gap-4">
        {PAYMENT_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            disabled={disabled || !provider.enabled}
            onClick={() => onSelect(provider.id)}
            className={`w-full flex items-center p-4 rounded-xl border text-left transition-colors ${
              selectedMethod === provider.id
                ? 'bg-violet-600/20 border-violet-500'
                : !provider.enabled
                ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                : 'bg-slate-900 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-4 ${
              selectedMethod === provider.id ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {/* Using text initials or static icons for now */}
              <span className="text-sm font-bold">{provider.id.toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${selectedMethod === provider.id ? 'text-white' : 'text-slate-200'}`}>
                {provider.name}
              </h4>
              {provider.description && (
                <p className="text-sm text-slate-400">{provider.description}</p>
              )}
            </div>
            {selectedMethod === provider.id && (
              <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!provider.enabled && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded">Coming Soon</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
