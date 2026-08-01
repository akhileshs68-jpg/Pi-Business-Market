import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

replacement = '''  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/inbox') return 'inbox';
    if (path === '/profile') return 'account';
    if (path.startsWith('/orders') || path.startsWith('/business-orders')) return 'orders';
    if (path.startsWith('/discovery')) return 'marketplace';
    if (path === '/' || path === '/home') return 'home';

    // Fallbacks using currentView
    if (currentView === 'inbox') return 'inbox';'''

# We want to replace from "const getActiveTab = () => {" to "if (currentView === 'inbox') return 'inbox';"
content = re.sub(r'const getActiveTab = \(\) => \{.*?if \(currentView === \'inbox\'\) return \'inbox\';', replacement, content, flags=re.DOTALL)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
