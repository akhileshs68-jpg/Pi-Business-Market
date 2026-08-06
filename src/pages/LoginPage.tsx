import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { isRealPiBrowser } from '../auth/authService';
import { Shield, Sparkles, AlertCircle, Smartphone, Monitor } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, profile, login, loading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const inPiBrowser = isRealPiBrowser();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from?.pathname || '/discovery';
      const targetPath = from === '/login' ? '/discovery' : from;
      
      console.log('[Auth Routing Diagnostics]', {
        currentUrl: window.location.href,
        authState: 'Authenticated',
        profileExists: !!profile,
        routeDecision: `Redirecting away from /login to target path: ${targetPath}`,
        redirectSourceFile: 'src/pages/LoginPage.tsx',
        redirectSourceLine: 21
      });
      
      navigate(targetPath, { replace: true });
    }
  }, [user, loading, navigate, location, profile]);

  const handlePiLogin = async (enableMock: boolean = false) => {
    try {
      setAuthError(null);
      if (enableMock || !inPiBrowser) {
        localStorage.setItem('DEV_MOCK_AUTH_ENABLED', 'true');
      }
      await login();
    } catch (err: any) {
      setAuthError(err.message || 'Pi Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative px-4 py-8 sm:py-0 z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {/* Environment Status Badge */}
          <div className="flex justify-center mb-6">
            {inPiBrowser ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Smartphone className="w-3.5 h-3.5" />
                Pi Browser Mobile Environment
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Monitor className="w-3.5 h-3.5" />
                Web Preview Mode
              </span>
            )}
          </div>

          {/* Logo / Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/20">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight font-sans">
              Pi Business Market
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Merchant & Pioneer Sign In
            </p>
          </div>

          {/* Non-Pi Browser Notice */}
          {!inPiBrowser && (
            <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left space-y-2">
              <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>AI Studio Web Preview</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Official Pi SDK native authentication runs inside the <strong>Pi Browser</strong> mobile app. For previewing & testing in this web view, click below to sign in with Sandbox credentials.
              </p>
            </div>
          )}

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-red-200 font-medium leading-relaxed">
                  {error || authError}
                </p>
              </div>
            </div>
          )}

          {/* Login Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handlePiLogin(false)}
              disabled={loading}
              className={`w-full group relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 shadow-xl shadow-violet-600/20 hover:shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>{inPiBrowser ? 'Authenticate with Pi SDK' : 'Sign In with Pi SDK (Or Sandbox)'}</span>
                </>
              )}
            </button>

            {!inPiBrowser && (
              <button
                onClick={() => handlePiLogin(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium text-xs border border-slate-700 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Developer Sandbox Sign-In (@dev_pioneer_mock)</span>
              </button>
            )}
            
            <p className="text-center text-slate-500 text-xs mt-6 leading-relaxed">
              By authenticating, you agree to the Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Decorative Accents */}
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Shield className="w-24 h-24 text-white rotate-12" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-mono">
            Powered by Pi Network Blockchain & Firestore
          </p>
        </div>
      </div>
    </div>
  );
};
