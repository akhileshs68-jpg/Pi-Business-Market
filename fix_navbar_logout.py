import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { useAuth } from '../auth/useAuth';")
content = content.replace("const [isCartOpen, setIsCartOpen] = useState(false);", "const [isCartOpen, setIsCartOpen] = useState(false);\n  const { logout } = useAuth();")

logout_button = '''                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-rose-600"
                  >
                    Logout
                  </button>'''

content = content.replace('''                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-slate-850"
                  >
                    Close
                </button>''', logout_button)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
