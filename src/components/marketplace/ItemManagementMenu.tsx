/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Store, 
  Package, 
  ShoppingBag, 
  Megaphone, 
  Edit, 
  Trash2, 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  Calendar, 
  Clock, 
  Users 
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useBusiness } from '../../context/BusinessContext';

export interface ItemManagementMenuProps {
  item: any;
  itemType?: 'product' | 'service' | 'store' | 'business' | 'auto';
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  className?: string;
  align?: 'left' | 'right';
  buttonVariant?: 'default' | 'card' | 'floating';
}

export const ItemManagementMenu: React.FC<ItemManagementMenuProps> = ({
  item,
  itemType = 'auto',
  onEdit,
  onDelete,
  className = '',
  align = 'right',
  buttonVariant = 'default'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const businessContext = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const businesses = businessContext?.businesses || [];
  const stores = businessContext?.stores || [];

  const ownedBusinessIds = useMemo(() => businesses.map(b => b.id), [businesses]);
  const ownedStoreIds = useMemo(() => stores.map(s => s.storeId), [stores]);

  // Verified ownership check - must evaluate strictly against authenticated user & owned assets
  const isOwner = useMemo(() => {
    if (!user || !item) return false;

    const uid = user.uid;
    const piUid = user.piUid;
    const username = user.username;

    // Extract item owner identifiers
    const itemOwnerUid = item.ownerUid || item.ownerId || item.sellerId || item.metadata?.ownerUid || item.metadata?.ownerId;
    const itemBusinessId = item.businessId || item.id || item.metadata?.businessId;
    const itemStoreId = item.storeId || item.metadata?.storeId;
    const itemUsername = item.username || item.sellerUsername || item.metadata?.username || item.metadata?.seller;

    // 1. Matches direct authenticated user UID or Pi UID
    if (itemOwnerUid && (itemOwnerUid === uid || itemOwnerUid === piUid)) return true;

    // 2. Matches an authenticated business owned by current user
    if (itemBusinessId && ownedBusinessIds.includes(itemBusinessId)) return true;

    // 3. Matches an authenticated store owned by current user
    if (itemStoreId && ownedStoreIds.includes(itemStoreId)) return true;

    // 4. Matches authenticated username or display name
    if (itemUsername && (itemUsername === username || (user.displayName && itemUsername === user.displayName))) return true;

    return false;
  }, [user, item, ownedBusinessIds, ownedStoreIds]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If user does not have verified ownership, DO NOT render management menu
  if (!isOwner) {
    return null;
  }

  // Determine effective category of item
  const resolvedType = useMemo(() => {
    if (itemType !== 'auto') return itemType;
    if (item.entityType) return item.entityType;
    if (item.serviceId || item.pricingType || item.locationType) return 'service';
    if (item.storeType || item.storeName || item.storeId) return 'store';
    if (item.legalName || item.businessType) return 'business';
    return 'product';
  }, [item, itemType]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    action();
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  // Build role/ownership specific menu options
  const renderMenuItems = () => {
    if (resolvedType === 'service') {
      return (
        <>
          <button
            onClick={(e) => handleAction(e, () => navigate('/services'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-violet-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Briefcase className="w-4 h-4 text-violet-400" />
            Manage My Services
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/bookings'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-violet-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            Manage My Bookings
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/services'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-violet-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            Manage Availability
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/merchant-analytics'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-violet-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Megaphone className="w-4 h-4 text-sky-400" />
            Manage Advertising
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/services'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-violet-600/20 rounded-xl transition-colors flex items-center gap-2.5 border-t border-slate-800/80 pt-2.5"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            Service Dashboard
          </button>
        </>
      );
    }

    if (resolvedType === 'business') {
      return (
        <>
          <button
            onClick={(e) => handleAction(e, () => navigate('/business-center'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            Manage Business
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/seller-dashboard'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Store className="w-4 h-4 text-sky-400" />
            Manage Stores
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/catalog'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            Manage Products
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/services'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Briefcase className="w-4 h-4 text-violet-400" />
            Manage Services
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/crm'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Users className="w-4 h-4 text-amber-400" />
            Manage Customers
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/merchant-analytics'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Megaphone className="w-4 h-4 text-pink-400" />
            Manage Advertising
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/business-center'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5 border-t border-slate-800/80 pt-2.5"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            Business Dashboard
          </button>
        </>
      );
    }

    if (resolvedType === 'store') {
      return (
        <>
          <button
            onClick={(e) => handleAction(e, () => navigate('/seller-dashboard'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            Manage My Store
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/catalog'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Package className="w-4 h-4 text-indigo-400" />
            Manage My Products
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/business-orders'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            Manage My Orders
          </button>
          <button
            onClick={(e) => handleAction(e, () => navigate('/merchant-analytics'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            Manage My Advertising
          </button>
          {onEdit && (
            <button
              onClick={(e) => handleAction(e, () => onEdit(item))}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <Edit className="w-4 h-4 text-violet-400" />
              Edit My Store
            </button>
          )}
          <button
            onClick={(e) => handleAction(e, () => navigate('/seller-dashboard'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-600/20 rounded-xl transition-colors flex items-center gap-2.5 border-t border-slate-800/80 pt-2.5"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            My Seller Dashboard
          </button>
        </>
      );
    }

    // Default: Product / Seller Asset
    return (
      <>
        <button
          onClick={(e) => handleAction(e, () => navigate('/seller-dashboard'))}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
        >
          <Store className="w-4 h-4 text-indigo-400" />
          Manage My Store
        </button>
        <button
          onClick={(e) => handleAction(e, () => navigate('/catalog'))}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
        >
          <Package className="w-4 h-4 text-emerald-400" />
          Manage My Products
        </button>
        <button
          onClick={(e) => handleAction(e, () => navigate('/business-orders'))}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
        >
          <ShoppingBag className="w-4 h-4 text-sky-400" />
          Manage My Orders
        </button>
        <button
          onClick={(e) => handleAction(e, () => navigate('/merchant-analytics'))}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          Manage My Advertising
        </button>
        {onEdit ? (
          <button
            onClick={(e) => handleAction(e, () => onEdit(item))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Edit className="w-4 h-4 text-violet-400" />
            Edit My Product
          </button>
        ) : (
          <button
            onClick={(e) => handleAction(e, () => navigate('/catalog'))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Edit className="w-4 h-4 text-violet-400" />
            Edit My Product
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => handleAction(e, () => onDelete(item.productId || item.id || item.entityId))}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2.5"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Delete Product
          </button>
        )}
        <button
          onClick={(e) => handleAction(e, () => navigate('/seller-dashboard'))}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600/20 rounded-xl transition-colors flex items-center gap-2.5 border-t border-slate-800/80 pt-2.5"
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-400" />
          My Seller Dashboard
        </button>
      </>
    );
  };

  const buttonStyle = buttonVariant === 'floating'
    ? 'p-2 bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-300 hover:text-white rounded-full border border-slate-800 shadow-lg'
    : buttonVariant === 'card'
    ? 'p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-all shadow-md'
    : 'p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        onClick={toggleOpen}
        className={buttonStyle}
        title="Manage Item"
        aria-label="Manage Item"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-1.5 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-1.5 space-y-0.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Merchant Controls
            </span>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded uppercase">
              Verified Owner
            </span>
          </div>
          {renderMenuItems()}
        </div>
      )}
    </div>
  );
};
