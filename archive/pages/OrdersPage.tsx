import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { OrderBookingManager } from '../components/OrderBookingManager';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Navbar 
        currentUser={user as any}
        currentView="dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar activeRole="seller" />
        <div className="flex-1 p-4 sm:p-8">
          <OrderBookingManager type="order" viewAs="seller" />
        </div>
      </div>
    </div>
  );
};
