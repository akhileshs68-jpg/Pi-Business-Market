import React, { useState, useEffect } from 'react';
import { FormField } from '../config/productServiceConfig';
import { Save, X } from 'lucide-react';

interface ProductFormProps {
  commonFields: FormField[];
  specificFields: FormField[];
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ commonFields, specificFields, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(initialData || {});

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
          <input
            type="file"
            onChange={(e) => handleChange(f.name, e.target.files?.[0])}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-400 focus:outline-none focus:border-violet-500"
          />
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
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Product
        </button>
      </div>
    </div>
  );
};
