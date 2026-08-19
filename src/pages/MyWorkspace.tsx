import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useActiveRole } from '../hooks/useActiveRole';
import { WORKSPACE_CONFIG } from '../config/workspaceConfig';
import Navbar from '../components/Navbar';
import { Shield, ArrowRight, Info, LogOut, ShoppingBag, ClipboardList, Clock, CreditCard, Calendar, Users, FileText, CheckCircle2, BookOpen, Star, Briefcase, Megaphone, Sparkles } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { businessService } from '../services/businessService';

const ICON_MAP: Record<string, React.FC<any>> = {
  ShoppingBag, ClipboardList, Clock, CreditCard, Calendar, Users, FileText, CheckCircle2, BookOpen, Star, Briefcase, Megaphone, Sparkles
};

export const MyWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const activeRole = useActiveRole();
  const navigate = useNavigate();

  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [bizLoading, setBizLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setBizLoading(false);
      return;
    }

    let active = true;
    const checkBiz = async () => {
      try {
        const bizs = await businessService.getMyBusinesses(user.uid);
        if (active) {
          setHasBusiness(bizs.length > 0);
          setBizLoading(false);
        }
      } catch (err) {
        console.error("Error checking business in MyWorkspace:", err);
        if (active) {
          setHasBusiness(false);
          setBizLoading(false);
        }
      }
    };
    checkBiz();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const config = WORKSPACE_CONFIG[activeRole] || WORKSPACE_CONFIG['buyer'];
  const isBuyer = activeRole === 'buyer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Navbar 
        currentUser={user as any}
        currentView="dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />
      
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar activeRole={activeRole} />
        
        <div className="flex-1 p-4 sm:p-8 pb-24 md:pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">{config.title}</h1>
                <p className="text-slate-400 font-medium text-xs sm:text-sm">Welcome back, {user.displayName}</p>
              </div>
            </div>
          </div>

          {bizLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          ) : !hasBusiness ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                <Info className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">No Business Found</h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                To manage inventory, sales, and stores, you first need to create a business entity on the Pi consensus ledger.
              </p>
              <button
                type="button"
                onClick={() => navigate('/create-business')}
                className="mt-2 min-h-[44px] px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Create Your First Business
              </button>
            </div>
          ) : isBuyer ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                <Info className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">No Business Modules</h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                You are currently in the standard Buyer role. To access merchant and provider operational modules, activate a business role from your Profile.
              </p>
              <button
                type="button"
                onClick={() => navigate('/profile?tab=settings')}
                className="mt-2 min-h-[44px] px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Switch Role in Settings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {config.modules.map((mod) => {
                const Icon = ICON_MAP[mod.iconName] || Briefcase;
                return (
                  <div
                    key={mod.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(mod.path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(mod.path);
                      }
                    }}
                    className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:bg-slate-900 hover:border-violet-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-lg focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-5 text-violet-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{mod.label}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-violet-400 font-bold text-xs uppercase tracking-widest gap-2">
                      <span>Access Module</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
