import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useActiveRole } from '../hooks/useActiveRole';
import { orderService } from '../services/orderService';
import { bookingService } from '../services/bookingService';
import { ORDER_STATUSES, BOOKING_STATUSES, ROLE_FEATURES } from '../config/orderBookingConfig';
import { Package, Calendar, Search, Filter } from 'lucide-react';

interface ManagerProps {
  type: 'order' | 'booking';
  viewAs: 'buyer' | 'seller';
}

export const OrderBookingManager: React.FC<ManagerProps> = ({ type, viewAs }) => {
  const { user } = useAuth();
  const activeRole = useActiveRole();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const statuses = type === 'order' ? ORDER_STATUSES : BOOKING_STATUSES;

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (type === 'order') {
        const fetched = viewAs === 'seller' 
          ? await orderService.getOrdersBySeller(user.uid)
          : await orderService.getOrdersByBuyer(user.uid);
        setItems(fetched);
      } else {
        const fetched = viewAs === 'seller'
          ? await bookingService.getBookingsBySeller(user.uid)
          : await bookingService.getBookingsByBuyer(user.uid);
        setItems(fetched);
      }
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user, type, viewAs]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!user) return;
    try {
      if (type === 'order') {
        await orderService.updateOrderStatus(id, status);
      } else {
        await bookingService.updateBookingStatus(id, status);
      }
      loadItems();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const filteredItems = items.filter(item => {
    return item.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            {type === 'order' ? <Package className="w-5 h-5 text-violet-400" /> : <Calendar className="w-5 h-5 text-violet-400" />}
          </div>
          <h2 className="text-xl font-bold text-white">
            {type === 'order' ? 'Orders' : 'Bookings'}
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${type}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No {type}s found.</div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white mb-1">ID: {item.id}</p>
                <p className="text-xs text-slate-400">Total: ${item.grandTotal || item.price || 0}</p>
                {type === 'booking' && (
                  <p className="text-xs text-slate-400">Date: {item.bookingDate} {item.bookingTime}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold whitespace-nowrap">
                  {item.orderStatus || item.bookingStatus || 'Pending'}
                </span>
                
                {viewAs === 'seller' && (
                  <select
                    value={item.orderStatus || item.bookingStatus || ''}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="" disabled>Update Status</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
