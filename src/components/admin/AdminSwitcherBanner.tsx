/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldAlert, X, ChevronRight, Settings } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { useAuth } from '../../auth/useAuth';

export const AdminSwitcherBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeBizId, setActiveBizId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [bizName, setBizName] = useState<string | null>(null);

  // Sync state with localStorage changes
  useEffect(() => {
    const syncState = () => {
      const bizId = localStorage.getItem('admin_switcher_active_business_id');
      const mode = localStorage.getItem('admin_switcher_mode');
      const name = localStorage.getItem('admin_switcher_business_name');
      
      setActiveBizId(bizId);
      setActiveMode(mode);
      setBizName(name || 'Unnamed Business');
    };

    syncState();
    
    // Periodically poll localStorage to catch changes instantly
    const interval = setInterval(syncState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExitSwitcher = async () => {
    if (!activeBizId) return;

    try {
      const db = getFirebaseDb();
      // Clear Firestore admin switcher session first
      if (user?.uid) {
        try {
          await deleteDoc(doc(db, 'adminSwitcherSessions', user.uid));
        } catch (sessionErr) {
          console.warn('Failed to clear admin switcher session document:', sessionErr);
        }
      }

      // Record exit event in audit logs if in support mode
      const logId = `AUD_ADMIN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      await setDoc(doc(db, 'adminAuditLogs', logId), {
        id: logId,
        adminId: user?.uid || 'system',
        adminName: user?.displayName || user?.username || 'Admin',
        businessId: activeBizId,
        businessName: bizName || 'Switched Business',
        action: `Exit Switcher (${activeMode?.toUpperCase()})`,
        timestamp: new Date().toISOString(),
        oldValue: activeMode,
        newValue: 'none',
        reason: 'Platform Owner terminated active impersonation session cleanly'
      });
    } catch (e) {
      console.warn('Failed to record exit switcher event:', e);
    }

    // Clear switcher keys from localStorage
    localStorage.removeItem('admin_switcher_active_business_id');
    localStorage.removeItem('admin_switcher_mode');
    localStorage.removeItem('admin_switcher_business_name');

    // Redirect to Admin Console
    window.location.href = '/admin-console';
  };

  // Prevent default actions or form updates globally if in read-only mode
  useEffect(() => {
    if (activeMode !== 'read_only') return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Identify form submissions, edit clicks, or save buttons
      const isInteractive = target.closest('button, input[type="submit"], [role="button"], a');
      if (isInteractive) {
        const text = isInteractive.textContent?.toLowerCase() || '';
        // Allow navigation, tab switches, and dialog close operations
        const isSafe = 
          text.includes('back') || 
          text.includes('close') || 
          text.includes('cancel') || 
          text.includes('view') || 
          text.includes('tab') || 
          text.includes('show') || 
          text.includes('exit') ||
          text.includes('select') ||
          isInteractive.closest('aside') || // Sidebar is safe
          isInteractive.closest('nav');      // Navbar navigation is safe
          
        if (!isSafe) {
          e.preventDefault();
          e.stopPropagation();
          
          // Display non-intrusive floating feedback
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-24 right-8 bg-rose-950 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase px-4 py-3 rounded-xl shadow-2xl z-[999] animate-bounce';
          toast.innerHTML = '🚫 Access Denied: Switched Business is in Read-Only Mode';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2500);
        }
      }
    };

    // Use capturing phase to intercept before React or other events process
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [activeMode]);

  if (!activeBizId) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-indigo-600 to-violet-700 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between gap-4 shadow-lg sticky top-0 z-[100] border-b border-white/10 animate-fade-in">
      <div className="flex items-center gap-2.5 md:gap-4 flex-1 truncate">
        <div className="p-1 bg-white/10 rounded-lg shrink-0">
          {activeMode === 'read_only' ? (
            <Eye className="w-4 h-4 text-amber-300" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-emerald-300 animate-pulse" />
          )}
        </div>
        <div className="truncate text-[11px] md:text-xs">
          <span className="opacity-80">Platform Administrator Active:</span>{' '}
          <strong className="text-white bg-white/10 px-2 py-0.5 rounded-md">{bizName}</strong>
          <span className="mx-2 text-white/30 hidden md:inline">|</span>
          <span className="opacity-90 capitalize inline-flex items-center gap-1">
            Mode:{' '}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
              activeMode === 'read_only' 
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
            }`}>
              {activeMode === 'read_only' ? 'Read-Only (View Only)' : 'Support Mode (All changes logged)'}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleExitSwitcher}
          className="bg-white hover:bg-slate-100 text-slate-900 px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase shadow-md transition-all active:scale-95 flex items-center gap-1"
        >
          Exit Session <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
