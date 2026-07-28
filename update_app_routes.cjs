const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('OrdersPage')) {
  const importStatement = "import { OrdersPage } from './pages/OrdersPage';\nimport { BookingsPage } from './pages/BookingsPage';\n";
  content = content.replace("import { ProductServiceManager } from './pages/ProductServiceManager';", importStatement + "import { ProductServiceManager } from './pages/ProductServiceManager';");
}

const routeReplacement = `
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
`;

content = content.replace(/<Route\s+path="\/store-dashboard"[\s\S]*?<\/ProtectedRoute>\s*\}\s*\/>/, routeReplacement + "\n          <Route path=\"/store-dashboard\" element={<ProtectedRoute><ProductServiceManager /></ProtectedRoute>} />");

fs.writeFileSync('src/App.tsx', content);
