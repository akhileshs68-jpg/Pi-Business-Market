/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  File, 
  Search, 
  Trash2, 
  ExternalLink, 
  Check,
  Grid,
  List,
  Filter,
  X,
  Loader2,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mediaService } from '../../services/mediaService';
import { MediaAsset, MediaModule } from '../../types';
import { FileUpload } from './FileUpload';

interface MediaLibraryProps {
  ownerUid: string;
  module?: MediaModule;
  onSelect?: (asset: MediaAsset) => void;
  allowSelection?: boolean;
  selectedIds?: string[];
  title?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  ownerUid,
  module,
  onSelect,
  allowSelection = false,
  selectedIds = [],
  title = 'Media Library'
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterModule, setFilterModule] = useState<MediaModule | 'all'>(module || 'all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [ownerUid]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const data = await mediaService.getMediaByOwner(ownerUid);
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch media', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;

    try {
      await mediaService.deleteMedia(mediaId);
      setAssets(prev => prev.filter(a => a.mediaId !== mediaId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = filterModule === 'all' || asset.module === filterModule;
    return matchesSearch && matchesModule;
  });

  const modules: (MediaModule | 'all')[] = [
    'all', 'users', 'businesses', 'stores', 'products', 'services', 'jobs', 'documents'
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <HardDrive className="w-3 h-3 text-violet-400" />
            Enterprise Digital Assets
          </p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className={`
            px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
            ${showUpload 
              ? 'bg-slate-800 text-white' 
              : 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20'
            }
          `}
        >
          {showUpload ? 'Close Upload' : 'Upload New'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {modules.map(m => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className={`
                px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap
                ${filterModule === m 
                  ? 'bg-violet-500/10 border-violet-500 text-violet-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }
              `}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 border-l border-slate-800 pl-4 ml-auto">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {showUpload ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto"
            >
              <FileUpload 
                ownerUid={ownerUid}
                module={filterModule === 'all' ? 'temporary' : filterModule}
                onUploadSuccess={(asset) => {
                  setAssets(prev => [asset, ...prev]);
                  setShowUpload(false);
                }}
              />
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Storage</p>
                  <p className="text-sm font-bold text-white">10 GB</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Assets</p>
                  <p className="text-sm font-bold text-white">{assets.length}</p>
                </div>
              </div>
            </motion.div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-slate-900 rounded-full">
                <ImageIcon className="w-12 h-12 text-slate-700" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">No assets found</p>
                <p className="text-sm text-slate-500">Upload your first image or document to get started</p>
              </div>
              <button 
                onClick={() => setShowUpload(true)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Upload Media
              </button>
            </div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "space-y-2"
              }
            >
              {filteredAssets.map(asset => (
                <div
                  key={asset.mediaId}
                  onClick={() => onSelect?.(asset)}
                  className={`
                    relative group cursor-pointer transition-all
                    ${viewMode === 'grid' 
                      ? 'aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/50' 
                      : 'flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50'
                    }
                    ${selectedIds.includes(asset.mediaId) ? 'ring-2 ring-violet-500' : ''}
                  `}
                >
                  {/* Grid Preview */}
                  {viewMode === 'grid' && (
                    <>
                      {asset.mimeType.startsWith('image/') ? (
                        <img 
                          src={asset.downloadUrl} 
                          alt={asset.originalName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-500">
                          <File className="w-10 h-10 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center line-clamp-1">
                            {asset.extension}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <p className="text-[10px] text-white font-bold line-clamp-2">{asset.originalName}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{mediaService.formatBytes(asset.size)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <a 
                            href={asset.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-slate-800 hover:bg-white hover:text-black rounded-lg transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button 
                            onClick={(e) => handleDelete(e, asset.mediaId)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {selectedIds.includes(asset.mediaId) && (
                        <div className="absolute top-2 right-2 bg-violet-500 text-white p-1 rounded-full shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </>
                  )}

                  {/* List View */}
                  {viewMode === 'list' && (
                    <>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                        {asset.mimeType.startsWith('image/') ? (
                          <img src={asset.downloadUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <File className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{asset.originalName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <span>{asset.extension}</span>
                          <span>•</span>
                          <span>{mediaService.formatBytes(asset.size)}</span>
                          <span>•</span>
                          <span className="text-violet-400">{asset.module}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <a 
                            href={asset.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={(e) => handleDelete(e, asset.mediaId)}
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                      {selectedIds.includes(asset.mediaId) && (
                        <div className="bg-violet-500 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>{filteredAssets.length} Assets Found</span>
          {selectedIds.length > 0 && (
            <span className="text-violet-400">{selectedIds.length} Selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3" />
          <span>Filtered by: {filterModule}</span>
        </div>
      </div>
    </div>
  );
};
