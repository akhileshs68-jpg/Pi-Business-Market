import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ShieldAlert, ArrowRight, UserCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { businessService } from '../services/businessService';
import { storeService } from '../services/storeService';
import { RoleResolver } from '../services/identity/RoleResolver';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
 }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const roleResolver = new RoleResolver(user);
  const isSuperAdmin = roleResolver.isSuperAdmin();
  const isOwner = isSuperAdmin || roleResolver.isBusinessOwner();

  const merchantRoutes = [
    '/dashboard',
    '/store-dashboard',
    '/seller-dashboard',
    '/inventory',
    '/business-orders',
    '/business-payments',
    '/services',
    '/catalog',
    '/warehouses',
    '/merchant-analytics'
  ];

  const isMerchantRoute = merchantRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  const [bizLoading, setBizLoading] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [hasStore, setHasStore] = useState(false);

  // Determine if we need to enforce and load business/store existence check
  const needsBizCheck = !isOwner && 
    location.pathname !== '/onboarding' && 
    location.pathname !== '/create-business' && 
    location.pathname !== '/create-store';

  useEffect(() => {
    if (!user) {
      setBizLoading(false);
      return;
    }
    
    if (!needsBizCheck) {
      setBizLoading(false);
      return;
    }

    let active = true;
    const checkBizAndStore = async () => {
      try {
        setBizLoading(true);
        const [bizs, stores] = await Promise.all([
          businessService.getMyBusinesses(user.uid),
          storeService.getOwnedStores(user.uid)
        ]);
        if (active) {
          setHasBusiness(bizs.length > 0);
          setHasStore(stores.length > 0);
          setBizLoading(false);
        }
      } catch (err) {
        console.error("Error checking business/store status:", err);
        if (active) {
          setBizLoading(false);
        }
      }
    };
    checkBizAndStore();
    return () => {
      active = false;
    };
  }, [user, location.pathname, needsBizCheck]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    console.log('[Auth Routing Diagnostics]', {
      currentUrl: window.location.href,
      authState: 'Unauthenticated',
      profileExists: false,
      routeDecision: 'Redirect to /login',
      redirectSourceFile: 'src/auth/ProtectedRoute.tsx',
      redirectSourceLine: 104
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect Super Admin away from landing routes (/home or /) directly to /admin-console
  if (isSuperAdmin && (location.pathname === '/home' || location.pathname === '/')) {
    console.log('[Auth Routing Diagnostics] Super Admin on landing route, redirecting to /admin-console');
    return <Navigate to="/admin-console" replace />;
  }

  // 1. Account Status Enforcement (Suspended / Disabled)
  if ((user.status as string) === 'suspended' || (user.status as string) === 'disabled' || (user as any).isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-4 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Your account has been suspended by platform administration. Please contact support if you believe this is an error.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // 2. Role-Based Access Control (RBAC) Enforcement
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleSet = roleResolver.getResolvedRoles();
    const userCanonical = roleResolver.getCanonicalRole();
    const activeRole = user.activeRole || user.role || userCanonical;

    const hasAllowedRole = isSuperAdmin || allowedRoles.some(r => {
      const norm = r.toLowerCase().replace(/[\s_-]/g, '_');
      return (
        userRoleSet.has(norm) || 
        userCanonical === norm || 
        activeRole === norm ||
        user.platformRole === norm ||
        user.roles?.includes(norm) ||
        user.roles?.includes(r)
      );
    });

    if (!hasAllowedRole) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            You do not have the required role ({allowedRoles.join(', ')}) to access this page.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Return Home
          </button>
        </div>
      );
    }
  }

  // Check if onboarding is complete. Owner is exempt.
  const profileExists = !!profile;
  const isLegacyUser = profileExists && 
    profile.onboardingCompleted === undefined && 
    profile.profileCompleted === undefined;

  const onboardingCompleted = isOwner || isLegacyUser || (
    profileExists && 
    profile.onboardingCompleted === true && 
    profile.profileCompleted === true
  );

  // Enforce Business and Store presence
  if (needsBizCheck) {
    if (bizLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
        </div>
      );
    }
    // If onboarding is complete but no business exists, we DO NOT redirect to /create-business automatically.
    if (!hasBusiness) {
      console.log('[Auth Routing Diagnostics]', {
        currentUrl: window.location.href,
        authState: 'Authenticated',
        profileExists,
        onboardingCompleted: profile?.onboardingCompleted,
        profileCompleted: profile?.profileCompleted,
        businessExists: hasBusiness,
        currentRoute: location.pathname,
        isLegacyUser,
        routeDecision: 'No Business found. DO NOT redirect automatically. Dashboard card will offer creation option.',
        redirectSourceFile: 'src/auth/ProtectedRoute.tsx',
        redirectSourceLine: 182
      });
    } else if (isMerchantRoute && !hasStore) {
      // For merchant routes specifically, also enforce store presence
      console.log('[Auth Routing Diagnostics]', {
        currentUrl: window.location.href,
        authState: 'Authenticated',
        profileExists,
        onboardingCompleted: profile?.onboardingCompleted,
        profileCompleted: profile?.profileCompleted,
        businessExists: hasBusiness,
        currentRoute: location.pathname,
        isLegacyUser,
        routeDecision: 'No Store found for merchant route. Redirect to /create-store',
        redirectSourceFile: 'src/auth/ProtectedRoute.tsx',
        redirectSourceLine: 201
      });
      return <Navigate to="/create-store" replace />;
    }
  }

  // If we reach here, we are allowing access to children
  console.log('[Auth Routing Diagnostics]', {
    currentUrl: window.location.href,
    authState: 'Authenticated',
    profileExists,
    onboardingCompleted: profile?.onboardingCompleted,
    profileCompleted: profile?.profileCompleted,
    businessExists: hasBusiness,
    currentRoute: location.pathname,
    isLegacyUser,
    routeDecision: `Allowing access to ${location.pathname}`,
    redirectSourceFile: 'src/auth/ProtectedRoute.tsx',
    redirectSourceLine: 221
  });

  return <>{children}</>;
};
