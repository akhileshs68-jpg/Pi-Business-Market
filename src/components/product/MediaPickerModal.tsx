/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaLibrary } from './MediaLibrary';
import { MediaAsset, MediaModule } from '../../types';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerUid: string;
  module: MediaModule;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
  selectedIds?: string[];
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  ownerUid,
  module,
  onSelect,
  title = 'Select Media',
  selectedIds = []
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl z-10"
          >
            <button 
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <MediaLibrary 
              ownerUid={ownerUid}
              module={module}
              onSelect={(asset) => {
                onSelect(asset);
                onClose();
              }}
              allowSelection
              selectedIds={selectedIds}
              title={title}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
