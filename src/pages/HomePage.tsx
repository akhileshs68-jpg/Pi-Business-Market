import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { BuyerHome } from '../components/marketplace/BuyerHome';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-violet-500/30">
      <Navbar 
        currentUser={user as any}
        currentView="home"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
        searchQuery={query}
        onSearchChange={setQuery}
        onSearchSubmit={(val) => {
          if (val.trim()) {
            navigate('/marketplace', { state: { query: val } });
          }
        }}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-28 lg:pb-28">
        <BuyerHome 
          user={user} 
          onSearchSubmit={(val) => navigate('/marketplace', { state: { query: val } })}
          onNavigate={(view) => navigate(`/${view}`)}
          onCategorySelect={(catId) => {
            navigate('/marketplace', { state: { category: catId } });
          }}
        />
      </main>
    </div>
  );
};
