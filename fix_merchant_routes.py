import re

with open('src/auth/ProtectedRoute.tsx', 'r') as f:
    content = f.read()

old_routes = """  const merchantRoutes = [
    '/dashboard',
    '/store-dashboard',
    '/inventory',
    '/business-orders',
    '/business-payments',
    '/services',
    '/catalog',
    '/warehouses',
    '/merchant-analytics'
  ];"""

new_routes = """  const merchantRoutes = [
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
  ];"""

content = content.replace(old_routes, new_routes)

with open('src/auth/ProtectedRoute.tsx', 'w') as f:
    f.write(content)
