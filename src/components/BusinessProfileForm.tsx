import React, { useState, useEffect } from 'react';
import { FormField } from '../config/businessProfileConfig';
import { Save, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import { FileUpload } from './product/FileUpload';
import { useAuth } from '../auth/useAuth';

interface BusinessProfileFormProps {
  generalFields: FormField[];
  specificFields: FormField[];
  initialData: any;
  onSave: (data: any, publish: boolean) => void;
}

export const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ generalFields, specificFields, initialData, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<any>(initialData || {});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const calculateCompletion = () => {
    const allFields = [...generalFields, ...specificFields];
    let filled = 0;
    let required = 0;
    
    allFields.forEach(f => {
      if (f.required) required++;
      if (formData[f.name]) filled++;
    });

    const totalToCount = required > 0 ? required : allFields.length;
    const filledToCount = required > 0 
      ? allFields.filter(f => f.required && formData[f.name]).length
      : filled;

    if (totalToCount === 0) return 100;
    return Math.round((filledToCount / totalToCount) * 100);
  };

  const completion = calculateCompletion();
  const allFields = [...generalFields, ...specificFields];
  const missingRequired = allFields.filter(f => f.required && !formData[f.name]);

  const renderField = (f: FormField) => {
    const value = formData[f.name] || '';
    const fieldId = `field-${f.name}`;

    return (
      <div key={f.name} className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="text-xs font-bold text-slate-300">
            {f.label} {f.required && <span className="text-rose-400 font-black">*</span>}
          </label>
          {f.required && !formData[f.name] && (
            <span className="text-[10px] font-semibold text-rose-400/90">Required</span>
          )}
        </div>

        {f.type === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder || f.label}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none min-h-[110px] transition-all resize-y"
          />
        ) : f.type === 'boolean' ? (
          <label className="flex items-center gap-3 min-h-[44px] px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors select-none">
            <input
              id={fieldId}
              type="checkbox"
              checked={!!formData[f.name]}
              onChange={(e) => handleChange(f.name, e.target.checked)}
              className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-200">Enabled / Active</span>
          </label>
        ) : f.type === 'image' ? (
          <div className="w-full">
            {value ? (
              <div className={f.name === 'logoUrl' ? 'w-[180px] h-[180px] md:w-[200px] md:h-[200px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 aspect-square mx-auto md:mx-0 shadow-lg' : 'w-full aspect-[16/9] md:aspect-[3/1] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-lg'}>
                <img src={value} alt={f.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => handleChange(f.name, '')} 
                  aria-label={`Remove ${f.label}`}
                  className="min-h-[44px] min-w-[44px] absolute top-2 right-2 p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl backdrop-blur shadow-lg z-20 flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <FileUpload
                ownerUid={user?.uid || ''}
                module="businesses"
                businessId={initialData?.businessId || (initialData?.storeId ? undefined : initialData?.id)}
                storeId={initialData?.storeId || (initialData?.storeId ? initialData?.id : undefined)}
                label={`Upload ${f.label}`}
                onUploadSuccess={(asset) => handleChange(f.name, asset.downloadUrl)}
              />
            )}
          </div>
        ) : (
          <input
            id={fieldId}
            type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder || f.label}
            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Profile Completion Status Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-600/10 border border-violet-500/20 rounded-xl">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Profile Readiness</h3>
              <p className="text-xs text-slate-400">Complete required fields to publish to Marketplace</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-violet-400">{completion}%</span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Ready</span>
          </div>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`} 
            style={{ width: `${completion}%` }} 
          />
        </div>

        {missingRequired.length > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-300">Required fields remaining before publishing:</p>
              <p className="text-xs text-rose-400/90 mt-1 flex flex-wrap gap-1.5">
                {missingRequired.map(f => (
                  <span key={f.name} className="px-2 py-0.5 bg-rose-500/20 rounded-md font-medium text-[11px]">
                    {f.label}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">General Information</h3>
            <p className="text-xs text-slate-500">Core business metadata visible across the marketplace catalog.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalFields.map(renderField)}
          </div>
        </div>

        {specificFields.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Role-Specific Settings</h3>
              <p className="text-xs text-slate-500">Parameters tailored to your registered enterprise category.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specificFields.map(renderField)}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onSave(formData, false)}
          className="min-h-[44px] px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
        >
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button
          type="button"
          onClick={() => onSave(formData, true)}
          disabled={missingRequired.length > 0}
          className="min-h-[44px] px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
        >
          <Check className="w-4 h-4" /> Publish Profile
        </button>
      </div>
    </div>
  );
};

