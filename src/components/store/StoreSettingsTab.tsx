import React, { useState } from 'react';
import { Store, OpeningHours, StoreType } from '../../types';
import { storeService } from '../../services/storeService';
import { 
  Settings, 
  Globe, 
  Truck, 
  DollarSign, 
  Clock, 
  Share2, 
  Search, 
  Image as ImageIcon,
  Check,
  Save,
  Bell,
  Eye
} from 'lucide-react';

interface StoreSettingsTabProps {
  store: Store;
  onRefreshStore: () => void;
  onToast: (msg: string) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({ store, onRefreshStore, onToast }) => {
  const [loading, setLoading] = useState(false);
  const [subSection, setSubSection] = useState<'general' | 'shipping' | 'hours' | 'seo'>('general');

  // Form State
  const [storeName, setStoreName] = useState(store.storeName || '');
  const [description, setDescription] = useState(store.description || '');
  const [storeType, setStoreType] = useState<StoreType>((store.storeType as any) || 'Retail');
  const [storeCategory, setStoreCategory] = useState(store.storeCategory || 'Electronics');
  const [email, setEmail] = useState(store.email || '');
  const [phone, setPhone] = useState(store.phone || '');
  const [website, setWebsite] = useState(store.website || '');
  
  // Address
  const [address, setAddress] = useState(store.address || '');
  const [city, setCity] = useState(store.city || '');
  const [state, setState] = useState(store.state || '');
  const [country, setCountry] = useState(store.country || 'USA');

  // Branding
  const [logoUrl, setLogoUrl] = useState(store.logoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(store.coverImageUrl || '');

  // Shipping, Tax, Wallet
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean>(!!store.deliveryAvailable);
  const [pickupAvailable, setPickupAvailable] = useState<boolean>(store.pickupAvailable !== false);
  const [taxRate, setTaxRate] = useState<number>(8.25);
  const [piWalletAddress, setPiWalletAddress] = useState<string>('G...PI-WALLET-MERCHANT-ADDRESS');
  const [notifyOnOrder, setNotifyOnOrder] = useState<boolean>(true);

  // Weekly Schedules
  const defaultHours = DAYS.map(day => {
    const existing = store.openingHours?.find(h => h.day === day);
    return existing || { day, open: '09:00', close: '18:00', closed: false };
  });
  const [openingHours, setOpeningHours] = useState<OpeningHours[]>(defaultHours);

  // SEO & Social Links
  const [seoTitle, setSeoTitle] = useState(`${store.storeName} - Shop Online`);
  const [seoDescription, setSeoDescription] = useState(store.description || 'Enterprise catalog of premium products');
  const [twitterHandle, setTwitterHandle] = useState('https://twitter.com/mystore');
  const [instagramHandle, setInstagramHandle] = useState('https://instagram.com/mystore');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates: any = {
        storeName,
        description,
        storeType,
        storeCategory,
        email,
        phone,
        website,
        address,
        city,
        state,
        country,
        logoUrl,
        coverImageUrl,
        deliveryAvailable,
        pickupAvailable,
        openingHours,
        // Optional extended metadata fields saved as custom attributes
        metadata: {
          taxRate,
          piWalletAddress,
          notifyOnOrder,
          seoTitle,
          seoDescription,
          twitterHandle,
          instagramHandle
        } as any
      };

      await storeService.updateStore(store.storeId, updates);
      onToast('Store settings saved successfully!');
      onRefreshStore();
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      alert('Error saving settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    setOpeningHours(prev => prev.map(h => {
      if (h.day === day) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sub navigation column */}
      <div className="space-y-2">
        {[
          { id: 'general', label: 'General & Branding', icon: Settings },
          { id: 'shipping', label: 'Shipping, Taxes & Pay', icon: Truck },
          { id: 'hours', label: 'Store Hours Schedule', icon: Clock },
          { id: 'seo', label: 'SEO & Social handles', icon: Globe }
        ].map(sect => {
          const Icon = sect.icon;
          return (
            <button 
              key={sect.id}
              onClick={() => setSubSection(sect.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left border transition-all ${
                subSection === sect.id 
                  ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' 
                  : 'bg-[#030712]/40 border-transparent text-slate-400 hover:text-white hover:bg-[#030712]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sect.label}
            </button>
          );
        })}
      </div>

      {/* Main Form column */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSave} className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          {subSection === 'general' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-white">General Profile & Branding</h4>
                <p className="text-[11px] text-slate-400">Manage basic core identifiers and public-facing profile cards.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Store Name</label>
                  <input 
                    type="text" 
                    required 
                    value={storeName} 
                    onChange={(e) => setStoreName(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Store Category</label>
                  <input 
                    type="text" 
                    required 
                    value={storeCategory} 
                    onChange={(e) => setStoreCategory(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Public Description</label>
                <textarea 
                  rows={4}
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Support Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Support Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-850 pt-6 space-y-4">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" /> Logo & Banner URLs
                </h5>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Logo URL</label>
                  <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Banner Cover Image URL</label>
                  <input 
                    type="text" 
                    value={coverImageUrl} 
                    onChange={(e) => setCoverImageUrl(e.target.value)} 
                    placeholder="https://example.com/cover.png"
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {subSection === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-white">Logistics & Financial Rules</h4>
                <p className="text-[11px] text-slate-400">Configure shipping dispatch channels, tax rates, and crypto credentials.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Home Delivery</span>
                    <span className="text-[11px] text-slate-400">Fulfill shipping orders</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Local Pickup</span>
                    <span className="text-[11px] text-slate-400">Enable in-store pickup</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pickupAvailable}
                    onChange={(e) => setPickupAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Store tax Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={taxRate} 
                    onChange={(e) => setTaxRate(Number(e.target.value))} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Merchant Pi Wallet Address</label>
                  <input 
                    type="text" 
                    value={piWalletAddress} 
                    onChange={(e) => setPiWalletAddress(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Instant Sales Alerts</span>
                    <span className="text-[11px] text-slate-500">Notify me immediately via email for each check-out.</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyOnOrder}
                  onChange={(e) => setNotifyOnOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {subSection === 'hours' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-white">Weekly Hours Schedule</h4>
                <p className="text-[11px] text-slate-400">Establish operational calendar hours shown on customer profile pages.</p>
              </div>

              <div className="space-y-3 bg-[#030712]/30 border border-slate-850 p-4 rounded-xl">
                {openingHours.map(hour => (
                  <div key={hour.day} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-slate-850/30 last:border-0 last:pb-0 gap-3">
                    <span className="text-xs font-black text-white w-24">{hour.day}</span>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {!hour.closed ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={hour.open} 
                            onChange={(e) => handleHourChange(hour.day, 'open', e.target.value)}
                            className="bg-[#030712] border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                          />
                          <span className="text-xs text-slate-500">to</span>
                          <input 
                            type="time" 
                            value={hour.close} 
                            onChange={(e) => handleHourChange(hour.day, 'close', e.target.value)}
                            className="bg-[#030712] border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-rose-500/70 uppercase tracking-widest">Closed All Day</span>
                      )}

                      <button 
                        type="button"
                        onClick={() => handleHourChange(hour.day, 'closed', !hour.closed)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border tracking-wider transition-all ${
                          hour.closed 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {hour.closed ? 'Unlock open' : 'Set closed'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subSection === 'seo' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-white">SEO & Social Links</h4>
                <p className="text-[11px] text-slate-400">Inject indexable search tags and display verified social media redirects.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Meta Title</label>
                  <input 
                    type="text" 
                    value={seoTitle} 
                    onChange={(e) => setSeoTitle(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Meta Description</label>
                  <input 
                    type="text" 
                    value={seoDescription} 
                    onChange={(e) => setSeoDescription(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Twitter Handle URL</label>
                  <input 
                    type="text" 
                    value={twitterHandle} 
                    onChange={(e) => setTwitterHandle(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Instagram Handle URL</label>
                  <input 
                    type="text" 
                    value={instagramHandle} 
                    onChange={(e) => setInstagramHandle(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-850 flex justify-end gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
            >
              {loading ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
