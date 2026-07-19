import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { StoreDashboard } from './pages/StoreDashboard';
import { ProductManagement } from './pages/ProductManagement';
import { CatalogManagement } from './pages/CatalogManagement';
import { WarehouseDashboard } from './pages/WarehouseDashboard';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { ServiceManagement } from './pages/ServiceManagement';
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

/**
 * Pi Business Market - Enterprise Entry Point
 * Focus: Enterprise Authentication & Business Identity Module
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />

          {/* PROTECTED ROUTES */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/business-dashboard" 
            element={
              <ProtectedRoute>
                <BusinessDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business/:id" 
            element={
              <ProtectedRoute>
                <BusinessProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store-dashboard" 
            element={
              <ProtectedRoute>
                <StoreDashboard />
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
                <ProductManagement />
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

          {/* REDIRECTS */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
