import re

with open("src/components/ProductForm.tsx", "r") as f:
    text = f.read()

# Add imports
text = text.replace("import { Save, X } from 'lucide-react';", "import { Save, X, Loader2 } from 'lucide-react';\nimport { mediaService } from '../services/mediaService';\nimport { useAuth } from '../auth/useAuth';")

# Add state variables
hook_replacement = """  const [formData, setFormData] = useState<any>(initialData || {});
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
"""

text = text.replace("  const [formData, setFormData] = useState<any>(initialData || {});", hook_replacement)

# Replace file input
file_input_replacement = """        ) : f.type === 'file' ? (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              disabled={uploading[f.name]}
              onChange={(e) => handleFileUpload(f.name, e.target.files)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-400 focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
            {uploading[f.name] && (
              <div className="flex items-center gap-2 text-xs text-violet-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Uploading... {uploadProgress[f.name] || 0}%</span>
              </div>
            )}
            {formData[f.name] && Array.isArray(formData[f.name]) && !uploading[f.name] && (
              <div className="text-xs text-emerald-400">{formData[f.name].length} file(s) uploaded successfully.</div>
            )}
            {formData[f.name] && typeof formData[f.name] === 'string' && !uploading[f.name] && (
              <div className="text-xs text-emerald-400">File uploaded successfully.</div>
            )}
            {uploadError && (
              <div className="text-xs text-rose-500">{uploadError}</div>
            )}
          </div>"""

text = re.sub(r"\)\s*:\s*f\.type\s*===\s*'file'\s*\?\s*\(\s*<input[^>]+type=\"file\"[^>]+>\s*\)", file_input_replacement, text)

# Disable save button when uploading
save_btn_replacement = """        <button
          onClick={() => onSave(formData)}
          disabled={Object.values(uploading).some(Boolean)}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >"""

text = text.replace("""        <button
          onClick={() => onSave(formData)}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors flex items-center gap-2"
        >""", save_btn_replacement)

with open("src/components/ProductForm.tsx", "w") as f:
    f.write(text)

