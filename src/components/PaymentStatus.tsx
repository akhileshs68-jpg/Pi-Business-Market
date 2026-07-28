import React from 'react';
import { PaymentStatusType } from '../types/payment';

export const PaymentStatusBadge: React.FC<{ status: PaymentStatusType }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Completed':
      case 'Refunded':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Pending':
      case 'Processing':
      case 'Refund Requested':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Failed':
      case 'Cancelled':
      case 'Expired':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor()}`}>
      {status}
    </span>
  );
};
