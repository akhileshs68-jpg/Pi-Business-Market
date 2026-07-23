import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Shield, Sparkles, AlertCircle, Chrome } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login, loginWithGoogle, loading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handlePiLogin = async () => {
    try {
      setAuthError(null);
      const loggedInUser = await login();
      if (loggedInUser && loggedInUser.uid) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Pi Authentication failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser && loggedInUser.uid) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative px-4 py-8 sm:py-0">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {/* Logo / Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/20">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight font-sans">
              Pi Business Market
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Enterprise Network Authentication
            </p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-red-200 font-medium leading-relaxed">
                  {error || authError}
                </p>
                {(error || authError)?.includes('Anonymous') && (
                  <p className="text-xs text-red-300/80">
                    Tip: You can use the Google login below as an alternative.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Actions */}
          <div className="space-y-4">
            <button
              onClick={handlePiLogin}
              disabled={loading}
              className={`w-full group relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 shadow-xl shadow-violet-600/20 hover:shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>Authenticate with Pi SDK</span>
                </>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-widest">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all duration-300 border border-slate-700 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
            
            <p className="text-center text-slate-500 text-xs mt-6 leading-relaxed">
              By authenticating, you agree to the Enterprise Terms of Service and Privacy Protocol.
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
