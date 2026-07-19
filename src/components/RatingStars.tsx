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
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= Math.round(rating);
        
        return (
          <button
            key={i}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(starValue)}
            className={`${onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
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
