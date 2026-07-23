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
  Settings
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Global Tracking Data...</p>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Shipment {shipment.shipmentId}</h1>
              <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                {shipment.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Linked to Order #{shipment.orderId.slice(0, 8)}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Logistics Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visual Tracking Progress */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10">
              <div className="flex items-center justify-between mb-12">
                <TrackingStep icon={<ClipboardList />} label="Packed" active={shipment.status !== ShipmentStatus.PENDING} />
                <div className={`flex-1 h-1 mx-4 rounded-full ${shipment.status === ShipmentStatus.IN_TRANSIT || shipment.status === ShipmentStatus.OUT_FOR_DELIVERY || shipment.status === ShipmentStatus.DELIVERED ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <TrackingStep icon={<Truck />} label="Transit" active={shipment.status === ShipmentStatus.IN_TRANSIT || shipment.status === ShipmentStatus.OUT_FOR_DELIVERY || shipment.status === ShipmentStatus.DELIVERED} />
                <div className={`flex-1 h-1 mx-4 rounded-full ${shipment.status === ShipmentStatus.DELIVERED ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <TrackingStep icon={<CheckCircle2 />} label="Delivered" active={shipment.status === ShipmentStatus.DELIVERED} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Navigation className="w-3 h-3 text-emerald-400" /> Destination
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{shipment.shippingAddress.fullName}</p>
                    <p className="text-xs text-slate-400">{shipment.shippingAddress.street}</p>
                    <p className="text-xs text-slate-400">{shipment.shippingAddress.city}, {shipment.shippingAddress.state} {shipment.shippingAddress.postalCode}</p>
                  </div>
                </div>
                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-indigo-400" /> Logistics Detail
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Carrier</span>
                      <span className="text-xs font-black text-white uppercase">{shipment.carrierId || 'Merchant Logistics'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Method</span>
                      <span className="text-xs font-black text-white uppercase">{shipment.shippingMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] flex items-center gap-6">
              <div className="p-4 bg-indigo-600/10 rounded-3xl text-indigo-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Secured Fulfillment</h4>
                <p className="text-xs text-slate-400 font-medium">This shipment is tracked on the immutable Pi Business Market ledger. Every scan is cryptographically signed.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Tracking Timeline */}
          <div className="lg:col-span-1">
            <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 sticky top-12">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-400" /> Tracking History
              </h2>
              <div className="relative space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {events.map((event, i) => (
                  <div key={event.eventId} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center z-10 ${
                      i === 0 ? 'bg-indigo-600 scale-125' : 'bg-slate-800'
                    }`}>
                      {i === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs font-black uppercase tracking-tight ${i === 0 ? 'text-white' : 'text-slate-400'}`}>
                        {event.description}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </p>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {new Date(event.eventTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrackingStep = ({ icon, label, active }: any) => (
  <div className="flex flex-col items-center gap-3">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
      active ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-slate-800 text-slate-700'
    }`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
  </div>
);

const StatusButton = ({ onClick, label, primary }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      primary 
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
    }`}
  >
    {label}
  </button>
);
