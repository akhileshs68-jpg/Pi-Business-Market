import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useActiveRole } from '../hooks/useActiveRole';
import { getConfigForRole } from '../config/productServiceConfig';
import { productService } from '../services/productService';
import { ProductForm } from '../components/ProductForm';
import { ServiceForm } from '../components/ServiceForm';
import Navbar from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Plus, Edit2, Trash2, Package, Briefcase, Search } from 'lucide-react';

export const ProductServiceManager: React.FC = () => {
  const { user } = useAuth();
  const activeRole = useActiveRole();
  const navigate = useNavigate();
  const config = getConfigForRole(activeRole);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetched = await productService.getItemsByOwner(user.uid, activeRole, config.type);
      setItems(fetched);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user, activeRole, config.type]);

  const handleSave = async (data: any) => {
    if (!user) return;
    try {
      if (editingItem) {
        await productService.updateItem(editingItem.id, config.type, data);
      } else {
        await productService.createItem({ ...data, ownerUid: user.uid, roleId: activeRole, type: config.type });
      }
      setIsFormOpen(false);
      setEditingItem(null);
      loadItems();
    } catch (err) {
      console.error('Failed to save item', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await productService.deleteItem(id, config.type);
      loadItems();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const filteredItems = items.filter(item => {
    const title = item.productName || item.serviceName || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Navbar 
        currentUser={user as any}
        currentView="dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar activeRole={activeRole} />
        
        <div className="flex-1 p-4 sm:p-8 pb-24 md:pb-12">
          {isFormOpen ? (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">
                  {editingItem ? `Edit ${config.type === 'product' ? 'Product' : 'Service'}` : `Add New ${config.type === 'product' ? 'Product' : 'Service'}`}
                </h1>
              </div>
              {config.type === 'product' ? (
                <ProductForm
                  commonFields={config.common}
                  specificFields={config.specific}
                  initialData={editingItem}
                  onSave={handleSave}
                  onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
                />
              ) : (
                <ServiceForm
                  commonFields={config.common}
                  specificFields={config.specific}
                  initialData={editingItem}
                  onSave={handleSave}
                  onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
                />
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                    {config.type === 'product' ? <Package className="w-6 h-6 text-white" /> : <Briefcase className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {config.type === 'product' ? 'Products' : 'Services'}
                    </h1>
                    <p className="text-slate-400 font-medium text-xs sm:text-sm">Manage your offerings.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>

              <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl">
                  <p className="text-slate-400 mb-4">No items found.</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Create your first {config.type}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                          {config.type === 'product' ? <Package className="w-6 h-6 text-slate-400" /> : <Briefcase className="w-6 h-6 text-slate-400" />}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{item.productName || item.serviceName}</h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-violet-400">${item.price}</span>
                        <span className="px-2.5 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-bold">{item.status || 'Draft'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
