import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# I want to add an optional :businessId to /store-dashboard. Wait, react-router v6 supports optional params with /:businessId? Yes.
# Or I can just map /seller-dashboard/:businessId to StoreDashboard, and /seller-dashboard to StoreDashboard.
old_route = '<Route path="/store-dashboard" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />'
new_route = '''<Route path="/store-dashboard" element={<Navigate to="/seller-dashboard" replace />} />
          <Route path="/seller-dashboard" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
          <Route path="/seller-dashboard/:businessId" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />'''

content = content.replace(old_route, new_route)

with open('src/App.tsx', 'w') as f:
    f.write(content)
