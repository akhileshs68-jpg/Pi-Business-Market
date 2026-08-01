/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Truck, 
  Package, 
  Building, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export interface CustomerInfo {
  fullName: string;
  mobileNumber: string;
  email: string;
  deliveryAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export type DeliveryType = 'standard' | 'express' | 'pickup';
export type PaymentMethodType = 'pi' | 'cod' | 'upi' | 'bank';

interface CheckoutFormProps {
  initialEmail?: string;
  onSubmit: (info: CustomerInfo, delivery: DeliveryType, payment: PaymentMethodType) => void;
  isSubmitting?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  initialEmail = '',
  onSubmit,
  isSubmitting = false
}) => {
  // Section 1: Customer Information State
  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: '',
    mobileNumber: '',
    email: initialEmail,
    deliveryAddress: '',
    city: '',
    state: '',
    country: 'Pi Pioneer Network',
    postalCode: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});

  // Section 2: Delivery Options
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryType>('standard');

  // Section 3: Payment Methods
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>('pi');

  // Section 5: Terms Checkbox
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof CustomerInfo]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required';
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = 'Delivery Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State or Province is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal or Zip Code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData, selectedDelivery, selectedPayment);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" id="checkout_main_form">
      {/* SECTION 1: Customer Information */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-800/60">
          <User className="w-5 h-5 text-violet-400" />
          <span>1. Customer & Shipping Information</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5" id="form_group_full_name">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Rahul Kumar"
                className={`w-full bg-slate-950 border ${
                  errors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
                } rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5" id="form_group_mobile">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                className={`w-full bg-slate-950 border ${
                  errors.mobileNumber ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
                } rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.mobileNumber}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5 md:col-span-2" id="form_group_email">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@pinetwork.com"
                className={`w-full bg-slate-950 border ${
                  errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
                } rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5 md:col-span-2" id="form_group_address">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Address</label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 pointer-events-none text-slate-500">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Street address, Apartment, Unit, Suite"
                className={`w-full bg-slate-950 border ${
                  errors.deliveryAddress ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
                } rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
              />
            </div>
            {errors.deliveryAddress && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.deliveryAddress}</span>
              </p>
            )}
          </div>

          {/* City */}
          <div className="space-y-1.5" id="form_group_city">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="New Delhi"
              className={`w-full bg-slate-950 border ${
                errors.city ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
              } rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
            />
            {errors.city && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.city}</span>
              </p>
            )}
          </div>

          {/* State */}
          <div className="space-y-1.5" id="form_group_state">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">State / Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="Delhi"
              className={`w-full bg-slate-950 border ${
                errors.state ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
              } rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
            />
            {errors.state && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.state}</span>
              </p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-1.5" id="form_group_country">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Country</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="India"
                className={`w-full bg-slate-950 border ${
                  errors.country ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
                } rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
              />
            </div>
            {errors.country && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.country}</span>
              </p>
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-1.5" id="form_group_postal_code">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Postal / Zip Code</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="110001"
              className={`w-full bg-slate-950 border ${
                errors.postalCode ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-violet-500'
              } rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors`}
            />
            {errors.postalCode && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.postalCode}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Delivery Options */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl" id="delivery_options_section">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-800/60">
          <Truck className="w-5 h-5 text-violet-400" />
          <span>2. Delivery Options</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Standard Delivery */}
          <div 
            onClick={() => setSelectedDelivery('standard')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              selectedDelivery === 'standard' 
                ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-600/5' 
                : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
            }`}
            id="delivery_opt_standard"
          >
            <div className="mt-1">
              <input 
                type="radio" 
                name="deliveryType" 
                checked={selectedDelivery === 'standard'} 
                onChange={() => {}}
                className="accent-violet-500 cursor-pointer h-4 w-4"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block uppercase tracking-tight">Standard Delivery</span>
              <p className="text-[10px] text-slate-400 leading-normal">Estimated delivery in 3-5 business days.</p>
              <span className="text-[11px] font-black text-emerald-400 block mt-1">FREE</span>
            </div>
          </div>

          {/* Express Delivery */}
          <div 
            onClick={() => setSelectedDelivery('express')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              selectedDelivery === 'express' 
                ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-600/5' 
                : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
            }`}
            id="delivery_opt_express"
          >
            <div className="mt-1">
              <input 
                type="radio" 
                name="deliveryType" 
                checked={selectedDelivery === 'express'} 
                onChange={() => {}}
                className="accent-violet-500 cursor-pointer h-4 w-4"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block uppercase tracking-tight">Express Delivery</span>
              <p className="text-[10px] text-slate-400 leading-normal">Super fast home delivery within 1-2 days.</p>
              <span className="text-[11px] font-black text-violet-400 block mt-1">2.50 Pi</span>
            </div>
          </div>

          {/* Store Pickup */}
          <div 
            onClick={() => setSelectedDelivery('pickup')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              selectedDelivery === 'pickup' 
                ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-600/5' 
                : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
            }`}
            id="delivery_opt_pickup"
          >
            <div className="mt-1">
              <input 
                type="radio" 
                name="deliveryType" 
                checked={selectedDelivery === 'pickup'} 
                onChange={() => {}}
                className="accent-violet-500 cursor-pointer h-4 w-4"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block uppercase tracking-tight">Store Pickup</span>
              <p className="text-[10px] text-slate-400 leading-normal">Pick up directly from the Merchant storefront.</p>
              <span className="text-[11px] font-black text-emerald-400 block mt-1">FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Payment Method */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl" id="payment_options_section">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-800/60">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <span>3. Payment Method</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pi Payment */}
          <div 
            onClick={() => setSelectedPayment('pi')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              selectedPayment === 'pi' 
                ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-600/5' 
                : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
            }`}
            id="payment_opt_pi"
          >
            <div className="mt-1">
              <input 
                type="radio" 
                name="paymentMethod" 
                checked={selectedPayment === 'pi'} 
                onChange={() => {}}
                className="accent-violet-500 cursor-pointer h-4 w-4"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-tight">Pi Network Web3 Pay</span>
                <span className="text-[8px] bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Recommended</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Secure non-custodial pay via standard Pi Browser Wallet integration.</p>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div 
            onClick={() => setSelectedPayment('cod')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              selectedPayment === 'cod' 
                ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-600/5' 
                : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
            }`}
            id="payment_opt_cod"
          >
            <div className="mt-1">
              <input 
                type="radio" 
                name="paymentMethod" 
                checked={selectedPayment === 'cod'} 
                onChange={() => {}}
                className="accent-violet-500 cursor-pointer h-4 w-4"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black text-white uppercase tracking-tight">Cash on Delivery (COD)</span>
              <p className="text-[10px] text-slate-400 leading-normal">Pay in Pi or standard local currency directly during pickup or delivery.</p>
            </div>
          </div>

          {/* UPI */}
          <div className="p-4 rounded-2xl border bg-slate-950/20 border-slate-900 opacity-60 flex items-start gap-4 select-none" id="payment_opt_upi">
            <div className="mt-1">
              <input type="radio" name="paymentMethodDisabled" disabled className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Unified Payments Interface (UPI)</span>
                <span className="text-[8px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-normal">Direct bank-to-bank instant Indian payments.</p>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="p-4 rounded-2xl border bg-slate-950/20 border-slate-900 opacity-60 flex items-start gap-4 select-none" id="payment_opt_bank">
            <div className="mt-1">
              <input type="radio" name="paymentMethodDisabled" disabled className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Direct Bank Wire / NEFT</span>
                <span className="text-[8px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-normal">Traditional local bank telegraphic settlement.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Terms Agreement & Submission */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl space-y-6" id="terms_submission_section">
        <div className="flex items-start gap-3.5" id="terms_checkbox_container">
          <input
            type="checkbox"
            id="agree_terms_checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 cursor-pointer h-4.5 w-4.5 accent-violet-500 rounded border-slate-800 focus:ring-0 focus:ring-offset-0"
          />
          <label htmlFor="agree_terms_checkbox" className="text-xs text-slate-400 font-medium leading-relaxed select-none cursor-pointer">
            I agree to the <span className="text-violet-400 hover:underline font-bold">Pi Business Market Terms & Conditions</span>, shipping guidelines, and the peer-to-peer decentralized dispute resolution frameworks.
          </label>
        </div>

        <button
          type="submit"
          disabled={!agreeTerms || isSubmitting}
          className={`w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
            agreeTerms && !isSubmitting
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/10 active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 border border-slate-800/50 cursor-not-allowed opacity-50'
          }`}
          id="place_order_button"
        >
          <Lock className="w-4 h-4" />
          <span>Place Order (Proceed to Payment Ready)</span>
        </button>
      </div>
    </form>
  );
};
