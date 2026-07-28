import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { 
  Wallet, 
  CheckCircle2, 
  ChevronRight, 
  LogOut, 
  AlertCircle, 
  ShieldCheck, 
  LayoutDashboard,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import { RoleOnboardingLauncher } from '../components/profile/RoleOnboardingLauncher';
import { ROLES_CONFIG, RoleConfig } from '../auth/authService';

import { AddBusinessRoleDialog } from '../components/AddBusinessRoleDialog';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals / State
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const [selectedRoleForOnboarding, setSelectedRoleForOnboarding] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [activeOnboardingRole, setActiveOnboardingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const roles: string[] = Array.isArray((user as any).roles) 
    ? (user as any).roles.map((r: string) => r.toLowerCase())
    : ['buyer'];
    
  const activeRole: string = (user as any).activeRole 
    ? String((user as any).activeRole).toLowerCase() 
    : 'buyer';

  const isBusinessRoleActive = ROLES_CONFIG[activeRole]?.hasWorkspace || false;

  const displayWalletAddress = (user.walletAddress && !user.walletAddress.startsWith('pi_wallet_'))
    ? user.walletAddress
    : 'Wallet not connected';

  // Handle Switching Active Role
  const handleSwitchActiveRole = async (roleId: string) => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await updateUser({
        activeRole: roleId
      } as any);
      const label = ROLES_CONFIG[roleId]?.label || roleId.toUpperCase();
      setSuccessMessage(`Successfully switched active role to: ${label}`);
    } catch (err: any) {
      console.error('[ProfilePage] Error switching active role:', err);
      setErrorMessage(err.message || 'Failed to switch active role.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to map roleId to proper RoleOnboardingLauncher prop
  const getOnboardingRoleName = (roleId: string): string => {
    switch (roleId) {
      case 'seller': return 'Seller';
      case 'service provider': return 'Service Provider';
      case 'manufacturer': return 'Manufacturer';
      case 'farmer': return 'Farmer';
      case 'artist': return 'Artist';
      case 'freelancer': return 'Freelancer';
      case 'company': return 'Company';
      default: return 'Other';
    }
  };

  // Filter available business roles that have not been activated yet
  const unactivatedBusinessRoles: RoleConfig[] = Object.values(ROLES_CONFIG).filter(
    (r: RoleConfig) => r.id !== 'buyer' && !roles.includes(r.id)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user}
        currentView="profile"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pb-24 sm:pb-16 relative">
        
        {/* Simplified Profile Header & Visual Center */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl z-10 space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-violet-600/10 to-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Identity Info */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-lg">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-violet-400 font-sans">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'P'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-xl shadow-md border-2 border-slate-900" title="Pi Verified Participant">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1 w-full px-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight truncate">
                  {user.displayName || 'Pi Pioneer'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  ✓ Pi Verified
                </span>
              </div>
              
              <p className="text-slate-400 text-xs font-semibold font-mono">
                @{user.username || 'pioneer'}
              </p>

              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-950/50 border border-slate-850 px-3 py-1 rounded-xl mt-2 max-w-full">
                <Wallet className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="font-mono truncate max-w-[180px] sm:max-w-xs" title={displayWalletAddress}>
                  {displayWalletAddress}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* Current Role & Active Role Swapper */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Active Role</span>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/25 rounded-lg text-xs font-black text-violet-400 capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  {ROLES_CONFIG[activeRole]?.iconName} {ROLES_CONFIG[activeRole]?.label || activeRole}
                </div>
              </div>
            </div>

            {/* Role Swapper tabs if user has multiple roles */}
            {roles.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">Switch Active Role</span>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((rId) => {
                    const rConfig = ROLES_CONFIG[rId];
                    const isSelected = activeRole === rId;
                    return (
                      <button
                        key={rId}
                        onClick={() => handleSwitchActiveRole(rId)}
                        disabled={saving}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-violet-600 text-white shadow-sm border border-violet-500/35' 
                            : 'bg-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span>{rConfig?.iconName || '👤'}</span>
                        <span className="capitalize">{rConfig?.label || rId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Workspace Action Panel */}
          {isBusinessRoleActive && (
            <div className="p-4 bg-violet-600/5 border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Workspace</h4>
                <p className="text-[10px] text-slate-400">Manage products, orders, finances, and business profile tools.</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition-all duration-300 rounded-xl shadow-md cursor-pointer shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>My Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <hr className="border-slate-800/60" />

          {/* "+ Add Business Role" Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setRoleSelectionOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold text-xs uppercase tracking-widest transition-all rounded-2xl border border-slate-700/60 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-violet-400" />
              <span>Add Business Role</span>
            </button>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 shadow-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 shadow-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Sign Out Trigger */}
        <div className="flex justify-center mt-12">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400/90 border border-rose-500/10 hover:border-rose-500/25 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </main>

      {/* 1. ROLE SELECTION DIALOG (MODAL) */}
      {roleSelectionOpen && (
        <AddBusinessRoleDialog
          unactivatedRoles={unactivatedBusinessRoles}
          onClose={() => setRoleSelectionOpen(false)}
          onSelectRole={(roleId) => {
            setSelectedRoleForOnboarding(roleId);
            setShowConfirmationDialog(true);
          }}
        />
      )}

      {/* 2. CONFIRMATION DIALOG (MODAL) */}
      {showConfirmationDialog && selectedRoleForOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowConfirmationDialog(false)}
          />
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full relative z-10 shadow-2xl space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Become a {ROLES_CONFIG[selectedRoleForOnboarding]?.label}?
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Are you sure you want to activate the {ROLES_CONFIG[selectedRoleForOnboarding]?.label} role? This will launch the corresponding onboarding wizard.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmationDialog(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationDialog(false);
                  setRoleSelectionOpen(false);
                  setActiveOnboardingRole(selectedRoleForOnboarding);
                }}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Confirm & Onboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ONBOARDING LAUNCHER WIZARD OVERLAY */}
      {activeOnboardingRole && (
        <RoleOnboardingLauncher
          role={getOnboardingRoleName(activeOnboardingRole)}
          user={user}
          onClose={() => {
            setActiveOnboardingRole(null);
            setSelectedRoleForOnboarding(null);
          }}
          onComplete={async () => {
            const roleToActivate = activeOnboardingRole;
            setActiveOnboardingRole(null);
            setSelectedRoleForOnboarding(null);
            
            // Activate the selected role upon successful onboarding
            setSaving(true);
            try {
              const updatedRoles = roles.includes(roleToActivate) ? roles : [...roles, roleToActivate];
              await updateUser({
                roles: updatedRoles,
                activeRole: roleToActivate
              } as any);
              const label = ROLES_CONFIG[roleToActivate]?.label || roleToActivate.toUpperCase();
              setSuccessMessage(`Onboarding completed! Switched active role to: ${label}`);
            } catch (err: any) {
              console.error('[ProfilePage] Error completing onboarding activation:', err);
              setErrorMessage('Onboarding succeeded, but we failed to activate the role on your profile.');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
