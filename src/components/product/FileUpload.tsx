/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mediaService } from '../../services/mediaService';
import { MediaAsset, MediaModule, MediaVisibility } from '../../types';

interface FileUploadProps {
  ownerUid: string;
  module: MediaModule;
  businessId?: string;
  storeId?: string;
  visibility?: MediaVisibility;
  onUploadSuccess: (asset: MediaAsset) => void;
  maxFiles?: number;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  ownerUid,
  module,
  businessId,
  storeId,
  visibility = 'public',
  onUploadSuccess,
  maxFiles = 1,
  label = 'Upload Media'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    setIsUploading(true);

    try {
      const asset = await mediaService.uploadMedia(file, ownerUid, {
        module,
        businessId,
        storeId,
        visibility
      });
      setSuccess(true);
      onUploadSuccess(asset);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer
          flex flex-col items-center justify-center text-center space-y-3
          ${isDragging 
            ? 'border-violet-500 bg-violet-500/10' 
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
        />

        <div className={`p-4 rounded-full ${isUploading ? 'bg-slate-800 animate-pulse' : 'bg-slate-800'}`}>
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <Upload className={`w-8 h-8 ${isDragging ? 'text-violet-400' : 'text-slate-500'}`} />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-slate-500">
            Drag & drop or click to select
          </p>
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            PNG, JPG, WEBP, SVG, PDF (MAX 10MB)
          </p>
        </div>

        {isUploading && (
          <div className="absolute inset-x-8 bottom-4">
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
