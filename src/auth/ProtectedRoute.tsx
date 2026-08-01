import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ShieldAlert, ArrowRight, UserCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { businessService } from '../services/businessService';
import { storeService } from '../services/storeService';

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

  const isOwner = user?.username === 'pi_pioneer_88';

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
