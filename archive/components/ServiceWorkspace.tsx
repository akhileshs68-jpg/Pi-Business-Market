import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Clock, 
  Calendar, 
  Users, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceOverview } from './ServiceOverview';

interface ServiceWorkspaceComponentProps {
  user: any;
  onLogout: () => void;
}

export const ServiceWorkspace: React.FC<ServiceWorkspaceComponentProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'My Services', icon: Briefcase },
    { id: 'bookings', label: 'Bookings', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleActionClick = (action: string) => {
    if (action === 'add_service') {
      setActiveTab('services');
    } else if (action === 'manage_services') {
      setActiveTab('services');
    } else if (menuItems.some(item => item.id === action)) {
      setActiveTab(action);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ServiceOverview onActionClick={handleActionClick} />;
      case 'services':
        return (
          <div className="space-y-6" id="service_management_tab">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Service Management</h2>
                <p className="text-xs text-slate-500 mt-1">Publish services, customize pricing packages, and list availability constraints.</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add New Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Smart Contract Audit Pro', rate: '150 π / audit', status: 'Active', hours: '4 completed', desc: 'Secure verification of EVM and WASM contract parameters for absolute consensus safety.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=60' },
                { title: 'Web3 Consultation Sprint', rate: '45 π / hr', status: 'Active', hours: '12 completed', desc: 'Architectural planning, wallet setup, and decentralized storage strategy mapping.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=60' },
                { title: 'dApp Frontend Optimization', rate: '80 π / project', status: 'Active', hours: '2 completed', desc: 'Transitioning Legacy Web2 interfaces to fast, decentralized, fully verified React structures.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=60' }
              ].map((srv, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-lg flex flex-col hover:border-slate-700 transition-all">
                  <div className="h-40 overflow-hidden bg-slate-950">
                    <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
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
      case 'bookings':
        return (
          <div className="space-y-6" id="service_bookings_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Bookings & Projects</h2>
              <p className="text-xs text-slate-500 mt-1">Review active appointments, milestones, and blockchain escrow receipts.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="py-4 px-6">Booking ID</th>
                      <th className="py-4 px-6">Client</th>
                      <th className="py-4 px-6">Service Name</th>
                      <th className="py-4 px-6">Scheduled Time</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Escrow Locked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 text-xs">
                    {[
                      { id: 'BKG-2940', client: 'Alice Mercer', service: 'Smart Contract Audit Pro', time: '2026-07-28 11:00 AM', status: 'Confirmed', escrow: '150 π' },
                      { id: 'BKG-2938', client: 'Bob Sterling', service: 'Web3 Consultation Sprint', time: '2026-07-28 02:00 PM', status: 'Pending', escrow: '45 π' },
                      { id: 'BKG-2921', client: 'Charlotte Webb', service: 'dApp Frontend Optimization', time: '2026-07-29 09:00 AM', status: 'In Progress', escrow: '80 π' }
                    ].map((bkg, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/10 transition-all">
                        <td className="py-4 px-6 font-mono font-bold text-slate-400">{bkg.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-200">{bkg.client}</td>
                        <td className="py-4 px-6 font-semibold text-slate-300">{bkg.service}</td>
                        <td className="py-4 px-6 text-slate-400 font-mono">{bkg.time}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                            bkg.status === 'Confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            bkg.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>{bkg.status}</span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-white text-right">{bkg.escrow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6" id="service_calendar_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Appointment Calendar</h2>
              <p className="text-xs text-slate-500 mt-1">Plan availability buffers, avoid duplicate slot locking, and block off offline hours.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-7 gap-4 text-center">
              {['Mon 27', 'Tue 28', 'Wed 29', 'Thu 30', 'Fri 31', 'Sat 01', 'Sun 02'].map((day, idx) => (
                <div key={idx} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">{day}</span>
                  <div className="space-y-1.5 text-[10px] font-semibold text-left">
                    {idx === 1 ? (
                      <>
                        <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded text-violet-400 truncate">11:00 Audit</div>
                        <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded text-violet-400 truncate">14:00 Consultation</div>
                      </>
                    ) : idx === 2 ? (
                      <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded text-violet-400 truncate">09:00 Optimization</div>
                    ) : (
                      <span className="text-slate-600 text-[9px] font-medium block text-center py-2">No slots locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'clients':
        return (
          <div className="space-y-6" id="service_clients_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Client Registry</h2>
              <p className="text-xs text-slate-500 mt-1">Review profiles, secure communications history, and total hours logged.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Alice Mercer', jobs: 5, rating: 5.0, bio: 'Founding Engineer at Pioneer Labs' },
                { name: 'Bob Sterling', jobs: 2, rating: 4.8, bio: 'Community Host at Pi Blockchain News' },
                { name: 'Charlotte Webb', jobs: 8, rating: 5.0, bio: 'Tech Lead of Consensus Core Systems' }
              ].map((cli, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 p-5 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{cli.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">{cli.bio}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-850 pt-3 text-[10px] font-black uppercase tracking-widest text-violet-400">
                    <span>{cli.jobs} Completed Jobs</span>
                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[8px]">
                      <Star className="w-2.5 h-2.5 fill-amber-500" /> {cli.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6" id="service_reviews_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Provider Reviews</h2>
              <p className="text-xs text-slate-500 mt-1">See your cryptographic signatures, testimonials, and blockchain trust validation metrics.</p>
            </div>
            <div className="space-y-4">
              {[
                { author: 'Alice Mercer', rating: 5, comment: 'Incredible work on our consensus logic! Saved us huge gas, completely verified the security matrices.', date: '3 days ago' },
                { author: 'Charlotte Webb', rating: 5, comment: 'Dr. Richard completed our dApp optimization inside the promised timeframe. Top professional.', date: '1 week ago' }
              ].map((rev, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">{rev.author}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">{rev.date}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-450 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'earnings':
        return (
          <div className="space-y-6" id="service_earnings_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Earnings Ledger</h2>
              <p className="text-xs text-slate-500 mt-1">Audit block height, transaction hashes, and payout timestamps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44">
                <div>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Available For Withdrawal</span>
                  <p className="text-3xl font-mono font-black text-white mt-1">1,280.00 π</p>
                </div>
                <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Withdraw to Pi Wallet
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Blockchain Escrow (Locked)</span>
                  <p className="text-2xl font-mono font-black text-amber-400 mt-1">275.00 π</p>
                  <p className="text-[10px] text-slate-400 mt-1">Funds are secured in escrow until service delivery or milestone completion is signed.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6" id="service_messages_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Secure Messaging Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Encrypted chat with clients regarding smart contract design requirements.</p>
            </div>
            <div className="bg-slate-900/45 border border-slate-850 p-12 text-center rounded-2xl">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-sm font-black text-slate-300 uppercase">No active conversations</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">Once clients initiate a query regarding your verified services, their encrypted messaging node will appear here.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6" id="service_settings_tab">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Workspace Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Edit custom certificates, verification requirements, and custom hourly buffer prices.</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Custom Slogan / Bio</label>
                <input 
                  type="text" 
                  defaultValue="Enterprise-Grade Engineering & Cryptographic Auditing Solutions for Pi"
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pi Wallet Address (Receiving Address)</label>
                <input 
                  type="text" 
                  defaultValue="GDKS2-94021-TXA32-9482L-CORE" 
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex" id="service_provider_workspace_layout">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-950 shrink-0">
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-black text-white">
            π
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Console</span>
            <span className="text-xs font-black text-white uppercase tracking-wider">Provider Portal</span>
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
                placeholder="Search bookings, clients..." 
                className="bg-transparent border-none text-[11px] font-semibold text-slate-300 placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            <button className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-600 rounded-full" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-850 overflow-hidden shrink-0">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Provider" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      <span className="text-xs font-black text-white uppercase tracking-wider">Provider Portal</span>
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
export default ServiceWorkspace;
