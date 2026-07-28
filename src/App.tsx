import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { MyWorkspace } from './pages/MyWorkspace';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { StoreDashboard } from './pages/StoreDashboard';
import { OrdersPage } from './pages/OrdersPage';
import { BookingsPage } from './pages/BookingsPage';
import { ProductServiceManager } from './pages/ProductServiceManager';
import { CatalogManagement } from './pages/CatalogManagement';
import { WarehouseDashboard } from './pages/WarehouseDashboard';
import { InventoryDashboard } from './pages/InventoryDashboard';

import { JobMarketplace } from './pages/JobMarketplace';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { UniversalSearch } from './pages/UniversalSearch';
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
              <ProtectedRoute allowedRoles={['Seller']}>
                <CatalogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
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
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            } 
          />

          <Route path="/store-dashboard" element={<ProtectedRoute><ProductServiceManager /></ProtectedRoute>} />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute>
                <ProductServiceManager />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/warehouses" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
                <WarehouseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
                <InventoryDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute allowedRoles={['Service Provider']}>
                <ProductServiceManager />
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
            path="/discovery" 
            element={
              <ProtectedRoute>
                <UniversalSearch />
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
              <ProtectedRoute allowedRoles={['Seller']}>
                <BusinessOrderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-payments" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
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
              <ProtectedRoute allowedRoles={['Seller']}>
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
              <ProtectedRoute allowedRoles={['Seller']}>
                <MerchantCRM />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crm/customer/:customerId" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
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
              <ProtectedRoute allowedRoles={['Seller']}>
                <ProductServiceManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store/:storeId" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
                <ProductServiceManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchant-analytics" 
            element={
              <ProtectedRoute allowedRoles={['Seller']}>
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

          {/* REDIRECTS */}
          <Route path="/" element={<Navigate to="/discovery" replace />} />
          <Route path="*" element={<Navigate to="/discovery" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
