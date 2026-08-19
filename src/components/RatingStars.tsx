/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
  onSelect?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  max = 5, 
  size = 16, 
  className = "",
  onSelect 
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`} role="img" aria-label={`Rating: ${rating.toFixed(1)} out of ${max} stars`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= Math.round(rating);
        
        return (
          <button
            key={i}
            type="button"
            disabled={!onSelect}
            aria-label={onSelect ? `Rate ${starValue} of ${max} stars` : undefined}
            onClick={() => onSelect?.(starValue)}
            className={`${
              onSelect 
                ? 'min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg' 
                : 'cursor-default'
            }`}
          >
            <Star 
              size={size} 
              className={isActive ? "fill-amber-400 text-amber-400" : "text-slate-700 fill-slate-800/50"} 
            />
          </button>
        );
      })}
    </div>
  );
};
