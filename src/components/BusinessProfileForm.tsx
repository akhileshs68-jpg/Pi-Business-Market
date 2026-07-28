import React, { useState, useEffect } from 'react';
import { FormField } from '../config/businessProfileConfig';
import { Save, Check, AlertCircle } from 'lucide-react';

interface BusinessProfileFormProps {
  generalFields: FormField[];
  specificFields: FormField[];
  initialData: any;
  onSave: (data: any, publish: boolean) => void;
}

export const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ generalFields, specificFields, initialData, onSave }) => {
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
    return (
      <div key={f.name} className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-300">
          {f.label} {f.required && <span className="text-rose-500">*</span>}
        </label>
        {f.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder || f.label}
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
        ) : (
          <input
            type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder || f.label}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Profile Status</h3>
          <div className="text-xl font-black text-violet-400">{completion}%</div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
          <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${completion}%` }} />
        </div>
        {missingRequired.length > 0 && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-400">Missing Required Fields</p>
              <p className="text-xs text-rose-400/80 mt-1">
                {missingRequired.map(f => f.label).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalFields.map(renderField)}
          </div>
        </div>

        {specificFields.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Role-Specific Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specificFields.map(renderField)}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
        <button
          onClick={() => onSave(formData, false)}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button
          onClick={() => onSave(formData, true)}
          disabled={missingRequired.length > 0}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Publish Profile
        </button>
      </div>
    </div>
  );
};
