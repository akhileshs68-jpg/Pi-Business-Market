/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';

export interface CheckoutInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

export const CheckoutInput: React.FC<CheckoutInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  required = false,
  id: customId,
  disabled = false
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;

  return (
    <div className="space-y-1.5">
      <label 
        htmlFor={inputId}
        className="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-0.5"
      >
        {label}
        {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
      </label>
      <input 
        id={inputId}
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        disabled={disabled}
        className="w-full min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

