import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

old_nav = """                if (item.id === 'home') {
                  if (onSearchChange) onSearchChange('');
                  if (onSearchSubmit) onSearchSubmit('');
                  onNavigate('dashboard');
                } else if (item.id === 'discover') {
                  onNavigate('dashboard');
                } else if (item.view === 'docs') {
                  window.location.href = '/docs';
                } else {
                  onNavigate(item.view);
                }"""

new_nav = """                if (item.id === 'home') {
                  if (onSearchChange) onSearchChange('');
                  if (onSearchSubmit) onSearchSubmit('');
                  onNavigate(item.view);
                } else if (item.id === 'discover') {
                  onNavigate('discovery');
                } else if (item.view === 'docs') {
                  window.location.href = '/docs';
                } else {
                  onNavigate(item.view);
                }"""

content = content.replace(old_nav, new_nav)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
