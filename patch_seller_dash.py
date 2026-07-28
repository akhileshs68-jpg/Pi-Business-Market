import re

with open("src/pages/SellerDashboard.tsx", "r") as f:
    text = f.read()

# Replace the beginning of the component up to "if (!isSeller) {"
new_top = """import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { SellerDashboard } from '../components/seller/SellerDashboard';
import { ShieldAlert, RefreshCw, ArrowLeft, Store, Briefcase } from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  // Support case-insensitive "Seller" role checks
  const activeRole = (user as any)?.activeRole || (user as any)?.role || '';
  const isSeller = activeRole.toLowerCase() === 'seller';
  
  const userRoles = (user as any)?.roles || [];
  const hasSellerRole = userRoles.map((r: string) => r.toLowerCase()).includes('seller');

  useEffect(() => {
    if (user && !isSeller && hasSellerRole && !isSwitching) {
      setIsSwitching(true);
      updateUser({ activeRole: 'Seller' }).catch((err: any) => {
        console.error('Auto switch failed:', err);
        setIsSwitching(false);
      });
    }
  }, [user, isSeller, hasSellerRole, updateUser, isSwitching]);

  if (loading || isSwitching) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">
          {isSwitching ? 'Switching to Seller account...' : 'Verifying merchant credentials...'}
        </p>
      </div>
    );
  }

  if (!user) {
"""

text = re.sub(r"import React from 'react';[\s\S]*?if \(\!user\) \{", new_top, text)

# Now find the "Switch Active Role to Seller" button and replace with "Become a Seller"
# and we should just make it go to /profile since they don't have the role.
# Let's replace the whole `if (!isSeller) {` block.

new_not_seller = """  if (!isSeller) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Seller Access Required</h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The current active identity is <span className="text-amber-400 font-bold">"{activeRole || 'Buyer'}"</span>.
          This console is strictly reserved for verified Pi merchants with an active Seller role.
        </p>
        
        <div className="mt-8 space-y-3 w-full">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-violet-600/10"
          >
            <Store className="w-4 h-4" />
            Become a Seller
          </button>
          
          <button 
            onClick={() => navigate('/discovery')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-slate-500 hover:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }"""

text = re.sub(r"  if \(\!isSeller\) \{[\s\S]*?Back to Marketplace\n          </button>\n        </div>\n      </div>\n    \);\n  \}", new_not_seller, text)


with open("src/pages/SellerDashboard.tsx", "w") as f:
    f.write(text)
