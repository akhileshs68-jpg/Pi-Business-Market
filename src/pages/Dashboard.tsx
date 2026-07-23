import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  Briefcase,
  Image as ImageIcon,
  Camera,
  FolderOpen,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { MediaPickerModal } from '../components/product/MediaPickerModal';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const { user, loading, logout, updateUser } = useAuth();
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8 md:p-12 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="w-32 h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8 md:p-12 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Enterprise Dashboard</h1>
              <p className="text-slate-400 font-medium text-xs sm:text-sm md:text-base">Welcome back, {user.displayName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-sm h-12 md:h-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* User Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 sm:mb-12">
          
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                <div 
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-violet-500/30 flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{user.displayName}</h2>
                    {user.verified && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
                  </div>
                  <p className="text-slate-500 font-mono text-xs sm:text-sm tracking-wider">@{user.username}</p>
                </div>
              </div>
              <span className="self-start px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                {user.role}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Pi UID</p>
                <p className="text-slate-300 font-mono text-sm truncate">{user.piUid}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Account Type</p>
                <p className="text-slate-300 capitalize">{user.accountType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Last Login</p>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(user.lastLogin).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Member Since</p>
                <p className="text-slate-300 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Pi Wallet</h3>
            </div>
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-2">Public Address</p>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <p className="text-slate-400 font-mono text-xs break-all leading-relaxed">
                  {user.walletAddress}
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800">
              <p className="text-slate-400 text-sm font-medium mb-1">KYC Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.kycVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className={`text-sm font-bold ${user.kycVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user.kycVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Network Status', value: 'Operational', color: 'text-emerald-400' },
            { label: 'Sync Status', value: 'Encrypted', color: 'text-violet-400' },
            { label: 'Media Assets', value: 'Manage All', color: 'text-white', action: () => setIsAssetsModalOpen(true) },
            { label: 'Session ID', value: user.uid.substring(0, 8), color: 'text-slate-500' },
          ].map((stat, i) => (
            <div 
              key={i} 
              onClick={stat.action}
              className={`bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl ${stat.action ? 'cursor-pointer hover:border-violet-500 transition-all group' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">{stat.label}</p>
                {stat.action && <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400" />}
              </div>
              <p className={`font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Access */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 shadow-2xl shadow-violet-600/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Business Identity Engine</h2>
              <p className="text-violet-100/80 font-medium">Manage multiple business profiles, stores, and professional identities on the Pi Network.</p>
            </div>
            <a 
              href="/business-dashboard"
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Briefcase className="w-5 h-5 text-violet-600" />
              Manage Businesses
            </a>
          </div>
        </div>

      </div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        ownerUid={user.uid}
        module="users"
        title="Update Profile Picture"
        onSelect={(asset) => updateUser({ photoUrl: asset.downloadUrl })}
      />

      <MediaPickerModal 
        isOpen={isAssetsModalOpen}
        onClose={() => setIsAssetsModalOpen(false)}
        ownerUid={user.uid}
        module="temporary" // Generic library view
        title="Media Assets Library"
        onSelect={() => {}} // Just browsing
      />
    </div>
  );
};
