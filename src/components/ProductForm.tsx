import React, { useState, useEffect } from 'react';
import { FormField } from '../config/productServiceConfig';
import { Save, X, Loader2 } from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { useAuth } from '../auth/useAuth';

interface ProductFormProps {
  commonFields: FormField[];
  specificFields: FormField[];
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ commonFields, specificFields, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(initialData || {});
  const { user } = useAuth();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (name: string, files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    setUploadError(null);
    setUploading(prev => ({ ...prev, [name]: true }));
    setUploadProgress(prev => ({ ...prev, [name]: 0 }));
    
    try {
      const urls: string[] = [];
      const totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const asset = await mediaService.uploadMedia(file, user.uid, {
          module: 'products',
          onProgress: (progress) => {
            // Calculate overall progress across multiple files
            const baseProgress = (i / totalFiles) * 100;
            const currentFileProgress = (progress / totalFiles);
            setUploadProgress(prev => ({ ...prev, [name]: Math.round(baseProgress + currentFileProgress) }));
          }
        });
        urls.push(asset.downloadUrl);
      }
      
      // If it's the images field, keep it as an array or use the first one based on form needs.
      // The requirement says "Replace images array with string URLs".
      handleChange(name, urls);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload images');
    } finally {
      setUploading(prev => ({ ...prev, [name]: false }));
      setUploadProgress(prev => ({ ...prev, [name]: 0 }));
    }
  };


  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const renderField = (f: FormField) => {
    const value = formData[f.name] || '';
    return (
      <div key={f.name} className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-300">
          {f.label} {f.required && <span className="text-rose-500">*</span>}
        </label>
        {f.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500 min-h-[100px]"
          />
        ) : f.type === 'boolean' ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!formData[f.name]}
              onChange={(e) => handleChange(f.name, e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-sm text-slate-300">Yes</span>
          </label>
        ) : f.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Select...</option>
            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : f.type === 'file' ? (
          <div className="w-full">
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(f.name, e.target.files)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-400 focus:outline-none focus:border-violet-500"
            />
            {uploading[f.name] && (
              <div className="mt-2 flex items-center gap-2 text-violet-400 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading {uploadProgress[f.name] || 0}%
              </div>
            )}
            {uploadError && <div className="mt-2 text-rose-500 text-xs font-bold">{uploadError}</div>}
            {Array.isArray(value) && value.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {value.map((url, idx) => (
                  <img key={idx} src={url} alt="Uploaded" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type={f.type}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commonFields.map(renderField)}
        </div>
      </div>
      
      {specificFields.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Specific Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specificFields.map(renderField)}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          disabled={Object.values(uploading).some(Boolean)}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" /> Save Product
        </button>
      </div>
    </div>
  );
};
