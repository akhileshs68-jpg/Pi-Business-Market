/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-[3rem]">
      <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-800">
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium max-w-sm mb-8">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
