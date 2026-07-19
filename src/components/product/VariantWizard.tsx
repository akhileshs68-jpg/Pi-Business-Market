/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Layers,
  Settings2,
  Package,
  CheckCircle2,
  AlertCircle,
  Tag,
  Boxes,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductVariant, VariantGroup, VariantOption } from '../../types';
import { variantService } from '../../services/variantService';

interface VariantWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product;
}

type Step = 1 | 2 | 3 | 4;

export const VariantWizard: React.FC<VariantWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product
}) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [groups, setGroups] = useState<Omit<VariantGroup, 'groupId'>[]>([]);
  const [options, setOptions] = useState<Record<number, string[]>>({}); // groupIndex -> array of values
  const [matrix, setMatrix] = useState<Partial<ProductVariant>[]>([]);

  const nextStep = () => setStep(s => Math.min(s + 1, 4) as Step);
  const prevStep = () => setStep(s => Math.max(s - 1, 1) as Step);

  const addGroup = () => {
    setGroups([...groups, { productId: product.productId, name: '', displayOrder: groups.length }]);
  };

  const removeGroup = (index: number) => {
    const newGroups = groups.filter((_, i) => i !== index);
    setGroups(newGroups);
    const newOptions = { ...options };
    delete newOptions[index];
    setOptions(newOptions);
  };

  const updateGroupName = (index: number, name: string) => {
    const newGroups = [...groups];
    newGroups[index].name = name;
    setGroups(newGroups);
  };

  const addOption = (groupIndex: number, value: string) => {
    if (!value.trim()) return;
    const current = options[groupIndex] || [];
    if (current.includes(value)) return;
    setOptions({ ...options, [groupIndex]: [...current, value] });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const current = options[groupIndex] || [];
    setOptions({
      ...options,
      [groupIndex]: current.filter((_, i) => i !== optionIndex)
    });
  };

  const generateMatrix = () => {
    // 1. Prepare data for service
    const groupsToProcess = groups.map((g, i) => ({ ...g, groupId: `temp_${i}` }));
    const optionsToProcess: VariantOption[] = [];
    Object.entries(options).forEach(([gIdx, opts]) => {
      opts.forEach((o, oIdx) => {
        optionsToProcess.push({
          optionId: `temp_${gIdx}_${oIdx}`,
          groupId: `temp_${gIdx}`,
          productId: product.productId,
          value: o,
          displayOrder: oIdx
        });
      });
    });

    const combinations = variantService.generateMatrix(groupsToProcess, optionsToProcess);
    
    const newMatrix = combinations.map(combo => {
      const sku = variantService.generateSKU(product.productName, combo);
      return {
        productId: product.productId,
        storeId: product.storeId,
        businessId: product.businessId,
        ownerUid: product.ownerUid,
        variantName: `${product.productName} - ${Object.values(combo).join(' - ')}`,
        attributes: combo,
        sku,
        price: product.price,
        comparePrice: product.comparePrice,
        currency: product.currency,
        stock: 0,
        reservedStock: 0,
        status: 'published',
        visibility: 'public',
        imageUrls: [],
      } as Partial<ProductVariant>;
    });

    setMatrix(newMatrix);
    nextStep();
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create groups and options first to get real IDs (optional, but good practice)
      // For this implementation, we'll just save the variants
      await variantService.createVariants(matrix as any);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save variants');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none mb-1">Variant Engine</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-indigo-400" />
                Enterprise Product Configuration Wizard
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            animate={{ width: `${(step / 4) * 100}%` }} 
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Define Variant Groups</h3>
                    <p className="text-sm text-slate-500">Add characteristics that distinguish your product variants.</p>
                  </div>
                  <button 
                    onClick={addGroup}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {groups.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950/30 border-2 border-dashed border-slate-800 rounded-3xl">
                      <Settings2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold italic">No groups defined. Start by adding "Color" or "Size".</p>
                    </div>
                  ) : (
                    groups.map((group, i) => (
                      <div key={i} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-4">
                        <div className="flex-1">
                          <input 
                            value={group.name}
                            onChange={(e) => updateGroupName(i, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                            placeholder="e.g., Color"
                          />
                        </div>
                        <button 
                          onClick={() => removeGroup(i)}
                          className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-8">
                  <button 
                    disabled={groups.length === 0 || groups.some(g => !g.name)}
                    onClick={nextStep}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    Next: Define Options <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Variant Options</h3>
                  <p className="text-sm text-slate-500">Define the specific values for each group.</p>
                </div>

                <div className="space-y-6">
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-4">
                      <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest">{group.name}</h4>
                      
                      <div className="flex flex-wrap gap-2">
                        {options[gIdx]?.map((opt, oIdx) => (
                          <div key={oIdx} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700">
                            {opt}
                            <button onClick={() => removeOption(gIdx, oIdx)} className="text-slate-500 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addOption(gIdx, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                          placeholder={`Add ${group.name} option...`}
                        />
                        <button 
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                            addOption(gIdx, input.value);
                            input.value = '';
                          }}
                          className="px-4 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    disabled={groups.some((_, i) => !options[i] || options[i].length === 0)}
                    onClick={generateMatrix}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    Generate Matrix <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Configuration Matrix</h3>
                    <p className="text-sm text-slate-500">Review and adjust details for all generated combinations.</p>
                  </div>
                  <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-xs font-black">
                    {matrix.length} Variants Generated
                  </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                  {matrix.map((variant, i) => (
                    <div key={i} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{variant.variantName}</p>
                            <div className="flex gap-2">
                              {Object.entries(variant.attributes || {}).map(([key, val]) => (
                                <span key={key} className="text-[10px] font-mono text-slate-500">
                                  {key}: <span className="text-slate-300">{val}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setMatrix(matrix.filter((_, idx) => idx !== i))}
                          className="p-2 text-slate-600 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">SKU</label>
                          <input 
                            value={variant.sku}
                            onChange={(e) => {
                              const newMatrix = [...matrix];
                              newMatrix[i].sku = e.target.value;
                              setMatrix(newMatrix);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Price ({variant.currency})</label>
                          <input 
                            type="number"
                            value={variant.price}
                            onChange={(e) => {
                              const newMatrix = [...matrix];
                              newMatrix[i].price = Number(e.target.value);
                              setMatrix(newMatrix);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Stock</label>
                          <input 
                            type="number"
                            value={variant.stock}
                            onChange={(e) => {
                              const newMatrix = [...matrix];
                              newMatrix[i].stock = Number(e.target.value);
                              setMatrix(newMatrix);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading || matrix.length === 0}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5" /> Publish Variants</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
