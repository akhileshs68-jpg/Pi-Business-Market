/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CheckoutInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export const CheckoutInput: React.FC<CheckoutInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  required = false
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
      {label}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <input 
      type={type}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
    />
  </div>
);
