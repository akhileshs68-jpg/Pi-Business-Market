import re

with open("src/pages/ServiceDashboard.tsx", "r") as f:
    text = f.read()

new_top = """import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { ServiceWorkspace } from '../components/service/ServiceWorkspace';
import { ShieldAlert, RefreshCw, ArrowLeft, Star, Briefcase, Award } from 'lucide-react';

export const ServiceDashboardPage: React.FC = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  // Check activeRole case-insensitively or exact match
  const activeRole = (user as any)?.activeRole || (user as any)?.role || '';
  const isServiceProvider = activeRole.toLowerCase() === 'serviceprovider';
  
  const userRoles = (user as any)?.roles || [];
  const hasProviderRole = userRoles.map((r: string) => r.toLowerCase()).includes('serviceprovider');

  useEffect(() => {
    if (user && !isServiceProvider && hasProviderRole && !isSwitching) {
      setIsSwitching(true);
      updateUser({ activeRole: 'serviceProvider' }).catch((err: any) => {
        console.error('Auto switch failed:', err);
        setIsSwitching(false);
      });
    }
  }, [user, isServiceProvider, hasProviderRole, updateUser, isSwitching]);

  if (loading || isSwitching) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">
          {isSwitching ? 'Switching to Service Provider account...' : 'Verifying provider credentials...'}
        </p>
      </div>
    );
  }

  if (!user) {"""

text = re.sub(r"import React from 'react';[\s\S]*?if \(\!user\) \{", new_top, text)


new_not_provider = """  if (!isServiceProvider) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">Service Provider Role Required</h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The current active identity is <span className="text-amber-400 font-bold">"{activeRole || 'Buyer'}"</span>.
          This console is strictly reserved for verified Pi Service Providers with an active Service Provider role.
        </p>
        
        <div className="mt-8 space-y-3 w-full">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-violet-600/10"
          >
            <Briefcase className="w-4 h-4" />
            Become a Service Provider
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

text = re.sub(r"  if \(\!isServiceProvider\) \{[\s\S]*?Back to Marketplace\n          </button>\n        </div>\n      </div>\n    \);\n  \}", new_not_provider, text)

# Remove duplicates
text = re.sub(r"  // Check activeRole case-insensitively or exact match\n  const activeRole = \(user as any\)\.activeRole \|\| user\.role \|\| '';\n  const isServiceProvider = activeRole\.toLowerCase\(\) === 'serviceprovider';\n", "", text)


with open("src/pages/ServiceDashboard.tsx", "w") as f:
    f.write(text)
