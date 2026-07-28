import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ShieldAlert, ArrowRight, UserCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const activeRole = (user as any)?.activeRole || null;

  if (allowedRoles && (!activeRole || !allowedRoles.map(r => r.toLowerCase()).includes(activeRole.toLowerCase()))) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
        <Navbar 
          currentUser={user as any}
          currentView="unauthorized"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center">
            {/* Background Gradient Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-2">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Role Access Restricted</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  You are trying to access a section that requires the{' '}
                  <span className="text-violet-400 font-bold">
                    {allowedRoles.join(' or ')}
                  </span>{' '}
                  role.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Current Active Role</span>
                  <span className="px-2 py-0.5 bg-slate-850 text-slate-300 font-bold rounded-md border border-slate-700/50">
                    {activeRole || 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Required Role</span>
                  <span className="px-2 py-0.5 bg-violet-950/50 text-violet-400 font-bold rounded-md border border-violet-800/30">
                    {allowedRoles.join(' / ')}
                  </span>
                </div>
              </div>

              <div className="text-sm text-amber-400/90 font-bold bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                Switch to the required role from your Profile.
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/15 cursor-pointer"
              >
                <UserCircle className="w-4 h-4" />
                <span>Go to Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
