/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Briefcase, 
  CheckCircle2 
} from 'lucide-react';
import { SearchIndexEntry } from '../../types';
import { ItemManagementMenu } from '../marketplace/ItemManagementMenu';

interface ServiceCardProps {
  item: SearchIndexEntry;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ item }) => {
  const navigate = useNavigate();

  // Deconstruct and extract service properties with reliable fallbacks
  const title = item.title || 'Expert Service';
  const description = item.description || 'Professional service offered by verified marketplace provider.';
  const category = item.categoryIds?.[0] || 'Professional Service';
  const location = item.location || 'Global/Remote';
  
  const metadata = item.metadata || {};
  const sellerName = metadata.seller || 'Verified Service Provider';
  const hasRating = typeof metadata.rating === 'number' && !isNaN(metadata.rating);
  const rating = hasRating ? (metadata.rating as number) : null;
  const hasReviewCount = typeof metadata.reviewCount === 'number' && !isNaN(metadata.reviewCount);
  const reviewCount = hasReviewCount ? (metadata.reviewCount as number) : null;
  const imageUrl = metadata.imageUrl || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500';

  // Format price
  const price = item.price !== undefined ? item.price : 0;
  const currency = item.currency || 'π';

  // Determine availability status / indicators
  const isOnline = item.keywords?.some(k => k.toLowerCase().includes('online')) || false;
  const locationType = isOnline ? 'Online / Remote' : (item.keywords?.find(k => k.toLowerCase().includes('site')) || 'Flexible');

  const handleCardClick = () => {
    navigate(`/service/${item.entityId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      id={`service-card-${item.entityId}`}
      role="button"
      tabIndex={0}
      aria-label={`${title} by ${sellerName}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group bg-[#0a0f1c] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-full shadow-md focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
    >
      <div className="space-y-3.5">
        {/* Service Header: Image & Rating */}
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500';
            }}
          />
          {/* Service Category Tag overlay */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-0.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-full text-[9px] font-bold uppercase tracking-wider text-violet-300">
              {category}
            </span>
          </div>

          {/* Three-Dot Merchant Management Menu */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <ItemManagementMenu item={item} itemType="service" buttonVariant="floating" />
          </div>

          {/* Rating Badge Overlay */}
          {hasRating && rating !== null && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-slate-950/90 backdrop-blur-md rounded-md text-[9px] font-bold text-amber-400 border border-amber-500/20">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {hasReviewCount && reviewCount !== null && (
                <span className="text-slate-400">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Provider Trust Segment */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
          <div className="w-6 h-6 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Briefcase className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-300 truncate tracking-tight">{sellerName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug group-hover:text-violet-300 transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* "What is Included" Highlight */}
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Professional Consultation
          </div>
        </div>
      </div>

      {/* Footer Details: Availability & Pricing & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 block">Starting Price</span>
          <div className="flex items-baseline gap-0.5 text-base font-bold text-white">
            <span className="text-lg text-violet-400 font-extrabold">{price}</span>
            <span className="text-xs font-semibold text-slate-400 ml-0.5">{currency}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* Availability Status */}
          <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            <Calendar className="w-2.5 h-2.5 text-emerald-400" /> Available Now
          </div>

          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-violet-300 transition-all">
            View Details <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
