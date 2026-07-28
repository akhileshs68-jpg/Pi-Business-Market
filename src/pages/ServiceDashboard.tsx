import React from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { ServiceWorkspace } from '../components/service/ServiceWorkspace';
import { ShieldAlert, RefreshCw, ArrowLeft, Star, Briefcase, Award } from 'lucide-react';

export const ServiceDashboardPage: React.FC = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">Verifying provider credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Authentication Required</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">Please sign in with your Pi Network account to access the service provider workspace.</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Check activeRole case-insensitively or exact match
  const activeRole = (user as any).activeRole || user.role || '';
  const isServiceProvider = activeRole.toLowerCase() === 'serviceprovider';

  if (!isServiceProvider) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Service Provider Role Required</h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The current active identity is <span className="text-amber-400 font-bold">"{activeRole || 'Buyer'}"</span>.
          This console is strictly reserved for verified Pi Service Providers with an active Service Provider role.
        </p>

        <div className="mt-8 space-y-3 w-full">
          <button 
            onClick={async () => {
              try {
                await updateUser({ activeRole: 'serviceProvider' });
              } catch (err) {
                console.error('Failed to update active role:', err);
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-violet-600/10"
          >
            <Briefcase className="w-4 h-4" />
            Switch Active Role to Service Provider
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            Onboard New Role / Edit Profile
          </button>

          <button 
            onClick={() => navigate('/discovery')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-slate-500 hover:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await updateUser({ activeRole: 'Buyer' });
      navigate('/discovery');
    } catch (err) {
      console.error('Failed to switch back to Buyer:', err);
      navigate('/discovery');
    }
  };

  return (
    <ServiceWorkspace 
      user={user} 
      onLogout={handleLogout} 
    />
  );
};

export default ServiceDashboardPage;
