import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { BusinessProvider } from './context/BusinessContext';
import { AdminSwitcherBanner } from './components/admin/AdminSwitcherBanner';

// Lazy loaded page components
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const MyWorkspace = lazy(() => import('./pages/MyWorkspace').then(m => ({ default: m.MyWorkspace })));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const StoreDashboard = lazy(() => import('./pages/StoreDashboard').then(m => ({ default: m.StoreDashboard })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then(m => ({ default: m.BookingsPage })));
const CatalogManagement = lazy(() => import('./pages/CatalogManagement').then(m => ({ default: m.CatalogManagement })));
const WarehouseDashboard = lazy(() => import('./pages/WarehouseDashboard').then(m => ({ default: m.WarehouseDashboard })));
const InventoryDashboard = lazy(() => import('./pages/InventoryDashboard').then(m => ({ default: m.InventoryDashboard })));
const ServiceManagement = lazy(() => import('./pages/ServiceManagement').then(m => ({ default: m.ServiceManagement })));
const JobMarketplace = lazy(() => import('./pages/JobMarketplace').then(m => ({ default: m.JobMarketplace })));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard').then(m => ({ default: m.EmployerDashboard })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const ProductDetails = lazy(() => import('./pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const CustomerOrders = lazy(() => import('./pages/CustomerOrders').then(m => ({ default: m.CustomerOrders })));
const OrderDetails = lazy(() => import('./pages/OrderDetails').then(m => ({ default: m.OrderDetails })));
const BusinessOrderDashboard = lazy(() => import('./pages/BusinessOrderDashboard').then(m => ({ default: m.BusinessOrderDashboard })));
const MerchantPayments = lazy(() => import('./pages/MerchantPayments').then(m => ({ default: m.MerchantPayments })));
const CustomerPayments = lazy(() => import('./pages/CustomerPayments').then(m => ({ default: m.CustomerPayments })));
const WalletPage = lazy(() => import('./pages/WalletPage').then(m => ({ default: m.WalletPage })));
const FulfillmentCenter = lazy(() => import('./pages/FulfillmentCenter').then(m => ({ default: m.FulfillmentCenter })));
const ShipmentDetails = lazy(() => import('./pages/ShipmentDetails').then(m => ({ default: m.ShipmentDetails })));
const MerchantCRM = lazy(() => import('./pages/MerchantCRM').then(m => ({ default: m.MerchantCRM })));
const Customer360 = lazy(() => import('./pages/Customer360').then(m => ({ default: m.Customer360 })));
const CustomerRewards = lazy(() => import('./pages/CustomerRewards').then(m => ({ default: m.CustomerRewards })));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const MerchantAnalytics = lazy(() => import('./pages/MerchantAnalytics'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile').then(m => ({ default: m.BusinessProfile })));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails').then(m => ({ default: m.ServiceDetails })));
const DocumentationPortal = lazy(() => import('./pages/DocumentationPortal'));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const CreateBusinessPage = lazy(() => import('./pages/CreateBusinessPage').then(m => ({ default: m.CreateBusinessPage })));
const CreateStorePage = lazy(() => import('./pages/CreateStorePage').then(m => ({ default: m.CreateStorePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CommunityHub = lazy(() => import('./pages/CommunityHub').then(m => ({ default: m.CommunityHub })));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage').then(m => ({ default: m.DirectoryPage })));
const ToolsPage = lazy(() => import('./pages/ToolsPage').then(m => ({ default: m.ToolsPage })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-200">
    <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center animate-pulse mb-3">
      <span className="text-xl font-bold text-violet-400 font-mono">π</span>
    </div>
    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Workspace...</div>
  </div>
);

/**
 * Pi Business Market - Enterprise Entry Point
 * Focus: Enterprise Authentication & Business Identity Module
 * 
 * Flow: After successful authentication, users are always redirected
 * to /discovery (Marketplace Home) and never to the Dashboard.
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <BusinessProvider>
          <Suspense fallback={<LoadingFallback />}>
            <AdminSwitcherBanner />
            <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/docs" element={<DocumentationPortal />} />

          {/* PROTECTED ROUTES */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-business" 
            element={
              <ProtectedRoute>
                <CreateBusinessPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-store" 
            element={
              <ProtectedRoute>
                <CreateStorePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'service_provider', 'superadmin']}>
                <MyWorkspace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/catalog" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <CatalogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-center" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'seller_admin', 'superadmin']}>
                <BusinessDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-business" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'seller_admin', 'superadmin']}>
                <BusinessDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/business/:id" element={<BusinessProfile />} />
          <Route path="/store/:id" element={<BusinessProfile />} />
          <Route path="/doctor/:id" element={<BusinessProfile />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/company/:id" element={<BusinessProfile />} />
          <Route path="/freelancer/:id" element={<BusinessProfile />} />
          <Route path="/artist/:id" element={<BusinessProfile />} />
          <Route path="/manufacturer/:id" element={<BusinessProfile />} />
          <Route path="/teacher/:id" element={<BusinessProfile />} />
          <Route path="/farmer/:id" element={<BusinessProfile />} />
          
          {/* Universal Product & Service Manager */}
          
          {/* Universal Orders & Bookings */}
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            } 
          />

          <Route path="/store-dashboard" element={<Navigate to="/seller-dashboard" replace />} />
          <Route path="/seller-dashboard" element={<ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}><StoreDashboard /></ProtectedRoute>} />
          <Route path="/seller-dashboard/:businessId" element={<ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}><StoreDashboard /></ProtectedRoute>} />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute allowedRoles={['service_provider', 'business_owner', 'seller_admin', 'superadmin']}>
                <ServiceManagement />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/warehouses" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <WarehouseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <InventoryDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <JobMarketplace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employer/jobs" 
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'employer', 'seller_admin', 'superadmin']}>
                <EmployerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/marketplace" 
            element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discovery" 
            element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout/:sessionId" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-success/:draftId" 
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <CustomerOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-details/:orderId" 
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/product/:id" 
            element={<ProductDetails />} 
          />
          <Route 
            path="/business-orders" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <BusinessOrderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-payments" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <MerchantPayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-payments" 
            element={
              <ProtectedRoute>
                <CustomerPayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logistics" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <FulfillmentCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/shipment/:shipmentId" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <ShipmentDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crm" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <MerchantCRM />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crm/customer/:customerId" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <Customer360 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rewards" 
            element={
              <ProtectedRoute>
                <CustomerRewards />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inbox" 
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store/:storeId/products" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <StoreDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store/:storeId" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <StoreDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchant-analytics" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'seller_admin', 'business_owner', 'superadmin']}>
                <MerchantAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-analytics" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'platform_admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-console" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'platform_admin']}>
                <AdminConsole />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/directory" 
            element={
              <ProtectedRoute>
                <DirectoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tools" 
            element={
              <ProtectedRoute>
                <ToolsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tools/community-price-calculator" 
            element={
              <ProtectedRoute>
                <ToolsPage />
              </ProtectedRoute>
            } 
          />

          {/* Alias & Convenience Routes for Business OS */}
          <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
          <Route path="/catalog-management" element={<Navigate to="/catalog" replace />} />
          <Route path="/customer-crm" element={<Navigate to="/crm" replace />} />
          <Route path="/merchant-payments" element={<Navigate to="/business-payments" replace />} />
          <Route path="/business-dashboard" element={<Navigate to="/business-center" replace />} />
          <Route path="/service-management" element={<Navigate to="/services" replace />} />

          {/* REDIRECTS */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </Suspense>
        </BusinessProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
