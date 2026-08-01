import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, File as FileIcon, Trash2, Eye, Download, AlertCircle, Loader2 } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types';

interface DocumentManagerProps {
  businessId: string;
  ownerUid: string;
  onClose: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ businessId, ownerUid, onClose }) => {
  const [documents, setDocuments] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [businessId, ownerUid]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch media assets for this business
      // Note: we can filter by module = 'businesses' and mimeType indicates document
      const assets = await mediaService.getMediaByOwner(ownerUid, 'businesses');
      const docs = assets.filter(a => a.businessId === businessId && a.mimeType === 'application/pdf');
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF documents are supported for business verification.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const asset = await mediaService.uploadMedia(file, ownerUid, {
        module: 'businesses',
        businessId,
        visibility: 'private',
        onProgress: (progress) => setUploadProgress(progress)
      });

      setDocuments(prev => [asset, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      setError(null);
      await mediaService.deleteMedia(mediaId);
      setDocuments(prev => prev.filter(d => d.mediaId !== mediaId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Business Documents</h2>
            <p className="text-slate-400 text-sm mt-1">Upload incorporation, tax, and licensing documents.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-8">
            <label 
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                {uploading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-indigo-400 mb-3 animate-spin" />
                    <p className="text-sm font-bold text-white mb-1">Uploading... {uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Click to upload document</p>
                    <p className="text-xs text-slate-500">PDF up to 10MB</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents ({documents.length})</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <FileIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.mediaId} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <FileIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{doc.originalName}</p>
                        <p className="text-xs text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a 
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(doc.mediaId)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentManager;
