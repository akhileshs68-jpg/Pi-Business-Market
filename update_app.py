import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { UniversalSearch } from './pages/UniversalSearch';", "import { HomePage } from './pages/HomePage';\nimport { MarketplacePage } from './pages/MarketplacePage';")
content = content.replace("<Route path=\"/discovery\" element={<Navigate to=\"/discovery\" replace />} />", "<Route path=\"/home\" element={<Navigate to=\"/home\" replace />} />")
content = content.replace("<Route path=\"*\" element={<Navigate to=\"/discovery\" replace />} />", "<Route path=\"*\" element={<Navigate to=\"/home\" replace />} />")
content = content.replace("<Route path=\"/\" element={<Navigate to=\"/discovery\" replace />} />", "<Route path=\"/\" element={<Navigate to=\"/home\" replace />} />")

old_route = """          <Route 
            path="/discovery" 
            element={
              <ProtectedRoute>
                <UniversalSearch />
              </ProtectedRoute>
            } 
          />"""

new_route = """          <Route 
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
          />"""

content = content.replace(old_route, new_route)

with open('src/App.tsx', 'w') as f:
    f.write(content)
