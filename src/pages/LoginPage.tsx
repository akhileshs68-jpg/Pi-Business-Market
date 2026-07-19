import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { Navigate, useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
 const navigate = useNavigate();

const { user, login, loading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handlePiLogin = async () => {
  try {
    setAuthError(null);

    await login();

    console.log("LOGIN SUCCESS");

    navigate("/dashboard", { replace: true });

  } catch (err: any) {
    setAuthError(err.message || "Pi Authentication failed. Please try again.");
  }
};

  if (user) {
  return <Navigate to="/dashboard" replace />;
}
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight font-sans">
              Pi Business Market
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Enterprise Network Authentication
            </p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium leading-relaxed">
                {error || authError}
              </p>
            </div>
          )}

          {/* Login Action */}
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
