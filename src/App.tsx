import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { MyWorkspace } from './pages/MyWorkspace';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { StoreDashboard } from './pages/StoreDashboard';
import { BookingsPage } from './pages/BookingsPage';
import { CatalogManagement } from './pages/CatalogManagement';
import { WarehouseDashboard } from './pages/WarehouseDashboard';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { ServiceManagement } from './pages/ServiceManagement';

import { JobMarketplace } from './pages/JobMarketplace';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { ProductDetails } from './pages/ProductDetails';
import { CustomerOrders } from './pages/CustomerOrders';
import { OrderDetails } from './pages/OrderDetails';
import { BusinessOrderDashboard } from './pages/BusinessOrderDashboard';
import { MerchantPayments } from './pages/MerchantPayments';
import { CustomerPayments } from './pages/CustomerPayments';
import { FulfillmentCenter } from './pages/FulfillmentCenter';
import { ShipmentDetails } from './pages/ShipmentDetails';
import { MerchantCRM } from './pages/MerchantCRM';
import { Customer360 } from './pages/Customer360';
import { CustomerRewards } from './pages/CustomerRewards';
import InboxPage from './pages/InboxPage';
import MerchantAnalytics from './pages/MerchantAnalytics';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminConsole from './pages/AdminConsole';
import { BusinessProfile } from './pages/BusinessProfile';
import DocumentationPortal from './pages/DocumentationPortal';
import { ProfilePage } from './pages/ProfilePage';
import { CartPage } from './pages/CartPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CreateBusinessPage } from './pages/CreateBusinessPage';
import { CreateStorePage } from './pages/CreateStorePage';

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
              <ProtectedRoute>
                <MyWorkspace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/catalog" 
            element={
              <ProtectedRoute>
                <CatalogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-center" 
            element={
              <ProtectedRoute>
                <BusinessDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/business/:id" element={<BusinessProfile />} />
          <Route path="/store/:id" element={<BusinessProfile />} />
          <Route path="/doctor/:id" element={<BusinessProfile />} />
          <Route path="/service/:id" element={<BusinessProfile />} />
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
          <Route path="/seller-dashboard" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
          <Route path="/seller-dashboard/:businessId" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute>
                <ServiceManagement />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/warehouses" 
            element={
              <ProtectedRoute>
                <WarehouseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <InventoryDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute>
                <ServiceManagement />
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
              <ProtectedRoute>
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
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-orders" 
            element={
              <ProtectedRoute>
                <BusinessOrderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-payments" 
            element={
              <ProtectedRoute>
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
            path="/logistics" 
            element={
              <ProtectedRoute>
                <FulfillmentCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/shipment/:shipmentId" 
            element={
              <ProtectedRoute>
                <ShipmentDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crm" 
            element={
              <ProtectedRoute>
                <MerchantCRM />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crm/customer/:customerId" 
            element={
              <ProtectedRoute>
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
              <ProtectedRoute>
                <StoreDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store/:storeId" 
            element={
              <ProtectedRoute>
                <StoreDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchant-analytics" 
            element={
              <ProtectedRoute>
                <MerchantAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-analytics" 
            element={
              <ProtectedRoute>
                <AdminAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-console" 
            element={
              <ProtectedRoute>
                <AdminConsole />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
