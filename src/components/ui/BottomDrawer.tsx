/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function BottomDrawer({
  isOpen,
  onClose,
  title,
  description,
  children
}: BottomDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Advanced scroll trapping, focus management, and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Save current scroll position to restore later
    const scrollY = window.scrollY;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    // Lock body scroll by fixing body in position without scrollbars jumping
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Set focus on first interactive element for proper accessibility
    setTimeout(() => {
      if (drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.width = originalStyle.width;
      document.body.style.overflow = originalStyle.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* High-Fidelity Backdrop Overlay with exact blur & transparency */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(12px)',
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              zIndex: 9999
            }}
            id="drawer_backdrop"
          />

          {/* Premium Bottom Drawer Container with X/Y swipes */}
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            drag={true}
            dragConstraints={{ top: 0, bottom: 300, left: 0, right: 300 }}
            dragElastic={{ top: 0.05, bottom: 0.85, left: 0.05, right: 0.85 }}
            onDragEnd={(_, info) => {
              // Close on swipe right or swipe down
              if (info.offset.y > 80 || info.velocity.y > 400 || info.offset.x > 80 || info.velocity.x > 400) {
                onClose();
              }
            }}
            style={{
              zIndex: 10000
            }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#080d19]/95 backdrop-blur-md border-t border-slate-900 rounded-t-[2rem] shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pb-safe max-w-lg mx-auto pointer-events-auto"
            id="drawer_container"
          >
            {/* Native Touch Handle Bar */}
            <div className="flex-shrink-0 pt-4 pb-2 w-full flex justify-center">
              <div 
                className="w-12 h-1.5 bg-slate-800 rounded-full cursor-grab active:cursor-grabbing transition-colors hover:bg-slate-700" 
                title="Swipe down or right to close"
              />
            </div>

            {/* Header section with Close button */}
            <div className="px-6 py-3 flex items-start justify-between gap-4 border-b border-slate-900/60 flex-shrink-0">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white tracking-tight uppercase">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-slate-400 font-medium">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area with inner overflow scroll */}
            <div className="px-6 py-4 overflow-y-auto scrollbar-none flex-1 space-y-4 text-slate-200 text-sm">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
