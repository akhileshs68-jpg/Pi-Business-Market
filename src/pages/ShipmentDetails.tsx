/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  ChevronRight, 
  ClipboardList, 
  Navigation, 
  ShieldCheck, 
  User, 
  Calendar, 
  Settings,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { shippingService } from '../services/shippingService';
import { Shipment, TrackingEvent, ShipmentStatus, ShippingMethod } from '../types';

export const ShipmentDetails: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMerchant, setIsMerchant] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData();
    }
  }, [shipmentId]);

  const fetchShipmentData = async () => {
    setLoading(true);
    try {
      const data = await shippingService.getShipment(shipmentId!);
      if (data) {
        setShipment(data);
        const trackingEvents = await shippingService.getTrackingEvents(shipmentId!);
        setEvents(trackingEvents);
        
        // Simulating merchant check (usually done via businessId in user profile)
        setIsMerchant(user?.uid === data.businessId || data.businessId === 'PI-CORP-001');
      }
    } catch (err) {
      console.error('Failed to fetch shipment data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: ShipmentStatus, location: string, desc: string) => {
    if (!shipment || !user) return;
    try {
      await shippingService.updateShipmentStatus(shipment.shipmentId, status, user.uid, location, desc);
      fetchShipmentData();
    } catch (err) {
      console.error('Failed to update shipment status', err);
    }
  };

  const handleCopyTracking = () => {
    const trackCode = shipment?.trackingNumber || shipment?.shipmentId;
    if (!trackCode) return;
    navigator.clipboard.writeText(trackCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (['in_transit', 'out_for_delivery', 'shipped'].includes(s)) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
    if (['packed', 'preparing', 'ready_for_dispatch'].includes(s)) {
      return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  if (loading) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6"
      >
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Retrieving Global Tracking Data...
        </p>
      </div>
    );
  }

  if (!shipment) return null;

  const isBuyer = Boolean(user && shipment && (user.uid === shipment.buyerId || user.uid === (shipment as any).userId));
  const isSeller = Boolean(user && shipment && (user.uid === shipment.sellerId || user.uid === shipment.businessId));
  const isCourier = Boolean(user && shipment && (user.uid === (shipment as any).courierId || user.uid === (shipment as any).carrierId));
  const isAdmin = Boolean(user && (user.role === 'Admin' || user.role === 'Super Admin' || user.platformRole === 'admin' || user.platformRole === 'superadmin'));
  const isAuthorized = isBuyer || isSeller || isCourier || isAdmin;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Shipment Access Denied</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Shipment tracking details are restricted to the buyer, seller, and assigned courier.
        </p>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="min-h-[44px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-10">
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors min-h-[44px] px-2 -ml-2 rounded-xl focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Back to Details</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight truncate">
                Shipment {shipment.shipmentId}
              </h1>
              <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border shrink-0 ${getStatusBadge(shipment.status)}`}>
                {shipment.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
              <span>Linked to Order #{shipment.orderId.slice(0, 8)}</span>
              {shipment.trackingNumber && (
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  aria-label={`Copy tracking code ${shipment.trackingNumber}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-mono font-bold text-amber-300 border border-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  <span>AWB: {shipment.trackingNumber}</span>
                  {copiedTracking ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              )}
            </div>
          </div>

          {isMerchant && shipment.status !== ShipmentStatus.DELIVERED && (
            <div className="flex flex-wrap gap-2">
              <StatusButton 
                onClick={() => handleUpdateStatus(ShipmentStatus.IN_TRANSIT, 'Logistics Hub', 'Package scanned and departed for delivery hub.')}
                label="Dispatch"
              />
              <StatusButton 
                onClick={() => handleUpdateStatus(ShipmentStatus.OUT_FOR_DELIVERY, 'Local Hub', 'Package is with the courier and out for delivery.')}
                label="Out for Delivery"
              />
              <StatusButton 
                onClick={() => handleUpdateStatus(ShipmentStatus.DELIVERED, 'Final Destination', 'Package successfully handed over to recipient.')}
                label="Confirm Delivery"
                primary
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Left Column: Logistics Info */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Visual Tracking Progress */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8 sm:mb-10">
                <TrackingStep icon={<ClipboardList />} label="Packed" active={shipment.status !== ShipmentStatus.PENDING} />
                <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${shipment.status === ShipmentStatus.IN_TRANSIT || shipment.status === ShipmentStatus.OUT_FOR_DELIVERY || shipment.status === ShipmentStatus.DELIVERED ? 'bg-violet-500' : 'bg-slate-800'}`} />
                <TrackingStep icon={<Truck />} label="Transit" active={shipment.status === ShipmentStatus.IN_TRANSIT || shipment.status === ShipmentStatus.OUT_FOR_DELIVERY || shipment.status === ShipmentStatus.DELIVERED} />
                <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${shipment.status === ShipmentStatus.DELIVERED ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <TrackingStep icon={<CheckCircle2 />} label="Delivered" active={shipment.status === ShipmentStatus.DELIVERED} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/80">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Destination
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{shipment.shippingAddress.fullName}</p>
                    <p className="text-xs text-slate-400">{shipment.shippingAddress.street}</p>
                    <p className="text-xs text-slate-400">{shipment.shippingAddress.city}, {shipment.shippingAddress.state} {shipment.shippingAddress.postalCode}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" /> Logistics Detail
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Carrier</span>
                      <span className="font-bold text-white uppercase">{shipment.carrierId || 'Merchant Logistics'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Method</span>
                      <span className="font-bold text-violet-300 uppercase">{shipment.shippingMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-violet-600/5 border border-violet-500/20 rounded-2xl flex items-center gap-4 sm:gap-5">
              <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400 shrink-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight">Secured Fulfillment</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  This shipment is tracked on the immutable Pi Business Market ledger. Every fulfillment scan is cryptographically signed.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Tracking Timeline */}
          <div className="lg:col-span-1">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 sticky top-8">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-violet-400" /> Tracking History
              </h2>
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {events.map((event, i) => (
                  <div key={event.eventId} className="relative pl-8">
                    <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                      i === 0 
                        ? 'bg-violet-600 border-violet-400 shadow-md shadow-violet-600/30' 
                        : 'bg-slate-900 border-slate-800'
                    }`}>
                      {i === 0 ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold uppercase tracking-tight ${i === 0 ? 'text-white' : 'text-slate-400'}`}>
                        {event.description}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-500" /> {event.location}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">
                        {new Date(event.eventTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-xs text-slate-500 italic pl-8">No tracking scans recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrackingStep = ({ icon, label, active }: any) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
      active ? 'bg-violet-600 border-violet-400 text-white shadow-md shadow-violet-600/20' : 'bg-slate-950 border-slate-800 text-slate-600'
    }`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const StatusButton = ({ onClick, label, primary }: any) => (
  <button 
    type="button"
    onClick={onClick}
    className={`min-h-[44px] px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
      primary 
        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20' 
        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
    }`}
  >
    {label}
  </button>
);
