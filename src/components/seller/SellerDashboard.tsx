import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Zap, 
  ClipboardList, 
  Users, 
  Layers, 
  CreditCard, 
  BarChart3, 
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SellerOverview } from './SellerOverview';

interface SellerDashboardComponentProps {
  user: any;
  onLogout: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardComponentProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'services', label: 'Services', icon: Zap },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Layers },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleActionClick = (action: string) => {
    if (action === 'add_product') {
      setActiveTab('products');
    } else if (action === 'add_service') {
      setActiveTab('services');
    } else if (menuItems.some(item => item.id === action)) {
      setActiveTab(action);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SellerOverview onActionClick={handleActionClick} />;
      case 'products':
        return (
          <div className="space-y-6" id="seller_products_tab">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Product Management</h2>
                <p className="text-xs text-slate-500 mt-1">Add, update, or remove physical and digital items from your storefront.</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>
            {/* Products grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Consensus Core Hardware Wallet', price: '45.0 π', stock: 3, sales: 84, image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=300&auto=format&fit=crop&q=60' },
                { name: 'Node-Max Pro Raspberry Pi Combo', price: '120.0 π', stock: 12, sales: 21, image: 'https://images.unsplash.com/photo-1517055720413-77a0215d2f62?w=300&auto=format&fit=crop&q=60' },
                { name: 'AeroSync Fitness Smartwatch', price: '35.0 π', stock: 1, sales: 110, image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=300&auto=format&fit=crop&q=60' }
              ].map((prod, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all">
                  <div className="h-44 overflow-hidden bg-slate-950 relative">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {prod.stock <= 3 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider rounded-md">
                        Low Stock ({prod.stock})
                      </span>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-slate-300 uppercase truncate">{prod.name}</h3>
                      <p className="text-sm font-black text-violet-400 font-mono mt-1">{prod.price}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-850/50 pt-3 text-[10px] text-slate-500 font-bold uppercase">
                      <span>Stock: {prod.stock}</span>
                      <span>Total Sales: {prod.sales}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-6" id="seller_services_tab">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Service Management</h2>
                <p className="text-xs text-slate-500 mt-1">Publish consulting, development, or trade services accessible for Pi.</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add New Service
              </button>
            </div>
            {/* Services grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Pi Smart Contract Audit', rate: '250 π / audit', status: 'Active', hours: '12 hrs done', desc: 'Comprehensive cryptographic security analysis for consensus contracts.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=60' },
                { title: 'Web3 Merchant Storefront Integration', rate: '50 π / hr', status: 'Active', hours: '45 hrs done', desc: 'Custom SDK connection and e-commerce portal mapping for business nodes.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=60' }
              ].map((srv, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row hover:border-slate-700 transition-all">
                  <div className="md:w-1/3 h-40 md:h-auto overflow-hidden bg-slate-950">
                    <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-5 md:w-2/3 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-200 uppercase truncate max-w-[200px]">{srv.title}</h3>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{srv.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">{srv.desc}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-850 pt-3 text-[10px] font-bold uppercase text-slate-500">
                      <span className="text-violet-400 font-mono font-black">{srv.rate}</span>
                      <span>{srv.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6" id="seller_orders_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Order Management</h2>
              <p className="text-xs text-slate-500 mt-1">Review pending node receipts, ship packages, and confirm Pi escrow releases.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Item</th>
                      <th className="py-4 px-6 text-right">Value</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 text-xs">
                    {[
                      { id: 'ORD-9842', customer: 'David Vance', item: 'Hardware Wallet', amount: '45.0 π', status: 'Pending', step: 'Release Escrow' },
                      { id: 'ORD-9839', customer: 'Sarah Connor', item: 'RasPi Combo', amount: '120.0 π', status: 'Completed', step: 'Refund' },
                      { id: 'ORD-9831', customer: 'Liam Neeson', item: 'Smart Contract Audit', amount: '250.0 π', status: 'Shipped', step: 'Track Node' }
                    ].map((ord, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/10 transition-all">
                        <td className="py-4 px-6 font-mono font-bold text-slate-400">{ord.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-200">{ord.customer}</td>
                        <td className="py-4 px-6 font-semibold text-slate-300">{ord.item}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-white">{ord.amount}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            ord.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            ord.status === 'Shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>{ord.status}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="px-3 py-1 bg-slate-850 hover:bg-violet-600 hover:text-white rounded text-[10px] font-black uppercase tracking-widest transition-all">
                            {ord.step}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'customers':
        return (
          <div className="space-y-6" id="seller_customers_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Customer Registry</h2>
              <p className="text-xs text-slate-500 mt-1">Track addresses, transaction logs, and CRM values for your customer base.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'David Vance', orders: 12, spent: '420 π', location: 'London, UK', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
                { name: 'Sarah Connor', orders: 5, spent: '112 π', location: 'Los Angeles, USA', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60' },
                { name: 'Liam Neeson', orders: 2, spent: '500 π', location: 'Belfast, Ireland', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' }
              ].map((cust, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
                  <img src={cust.avatar} alt={cust.name} className="w-12 h-12 rounded-xl object-cover border border-slate-800" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{cust.name}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{cust.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-violet-400 uppercase tracking-widest">
                      <span>{cust.orders} Orders</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span>{cust.spent} Spent</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-6" id="seller_inventory_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Inventory Hub</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time node-level tracking, reorder alert margins, and warehouse syncing.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 space-y-4 shadow-xl">
              {[
                { name: 'Consensus Core Hardware Wallet', sku: 'SKU-WAL-092', stock: 3, thresh: 5, status: 'Restock Urgently' },
                { name: 'Node-Max Pro Raspberry Pi Combo', sku: 'SKU-RPI-104', stock: 12, thresh: 5, status: 'In Stock' },
                { name: 'AeroSync Fitness Smartwatch', sku: 'SKU-WCH-812', stock: 1, thresh: 3, status: 'Restock Urgently' }
              ].map((inv, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/40 border border-slate-850 rounded-xl text-xs">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{inv.sku}</span>
                    <h4 className="text-xs font-black text-slate-200 uppercase mt-0.5">{inv.name}</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase">Stock Status</span>
                      <span className={`font-mono font-bold ${inv.stock <= inv.thresh ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {inv.stock} / {inv.thresh} Threshold
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      inv.stock <= inv.thresh ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6" id="seller_payments_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Payments & Escrow Wallet</h2>
              <p className="text-xs text-slate-500 mt-1">Review locked consensus balances, gas payouts, and direct smart contract transfers.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44">
                <div>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Withdrawable Balance</span>
                  <p className="text-3xl font-mono font-black text-white mt-1">1,420.00 π</p>
                </div>
                <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Withdraw to Pi Wallet
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Locked in Escrow</span>
                  <p className="text-2xl font-mono font-black text-amber-400 mt-1">182.50 π</p>
                  <p className="text-[10px] text-slate-400 mt-1">Released automatically upon buyer delivery sign-off on the blockchain.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6" id="seller_reports_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Business Intelligence Reports</h2>
              <p className="text-xs text-slate-500 mt-1">Download custom Excel spreadsheets, conversion audits, or traffic trends of your storefront.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Monthly Revenue Audit (July 2026)', size: '1.2 MB', ext: 'PDF' },
                { name: 'Store Traffic & Page Analytics', size: '512 KB', ext: 'XLSX' },
                { name: 'Escrow Compliance & Ledger Sync', size: '4.1 MB', ext: 'CSV' }
              ].map((rep, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{rep.name}</h4>
                    <span className="text-[9px] font-mono text-slate-500 mt-0.5">{rep.size} • {rep.ext}</span>
                  </div>
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-violet-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded text-slate-400 transition-colors">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6" id="seller_settings_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Storefront Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Configure automated replies, custom shipping rules, and blockchain fee configurations.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Custom Store Slogan</label>
                <input 
                  type="text" 
                  defaultValue="Enterprise-Grade Engineering Solutions for the Pi Ecosystem"
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Consensus Gas Fee Buffer (π)</label>
                <input 
                  type="text" 
                  defaultValue="0.01" 
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono font-bold"
                />
              </div>

              <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Save Settings
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex" id="seller_dashboard_layout">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-950 shrink-0">
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-black text-white">
            π
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Console</span>
            <span className="text-xs font-black text-white uppercase tracking-wider">Merchant Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900 space-y-2">
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 text-center">
            <span className="text-[9px] font-mono text-slate-500 block">Logged in as</span>
            <span className="text-xs font-bold text-white block mt-0.5 truncate">{user?.displayName || 'Pioneer'}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Switch to Buyer
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-violet-500">π</span> 
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-xl w-60">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search orders, inventory..." 
                className="bg-transparent border-none text-[11px] font-semibold text-slate-300 placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            <button className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-600 rounded-full" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-850 overflow-hidden shrink-0">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Storeowner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-violet-600 flex items-center justify-center font-black text-white text-xs">P</div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Drawer Navigation Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-slate-950 border-r border-slate-900 p-6 z-50 flex flex-col justify-between lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-black text-white">
                      π
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Console</span>
                      <span className="text-xs font-black text-white uppercase tracking-wider">Merchant Portal</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left ${
                          isActive 
                            ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-slate-900 space-y-2">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 text-center">
                  <span className="text-[9px] font-mono text-slate-500 block">Logged in as</span>
                  <span className="text-xs font-bold text-white block mt-0.5 truncate">{user?.displayName || 'Pioneer'}</span>
                </div>
                <button 
                  onClick={() => {
                    onLogout();
                    setSidebarOpen(false);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Switch to Buyer
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
