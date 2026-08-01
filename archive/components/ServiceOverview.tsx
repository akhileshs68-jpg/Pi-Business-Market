import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Users, 
  Star, 
  Calendar, 
  ShieldCheck, 
  Bell, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronRight, 
  User, 
  MapPin, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceOverviewProps {
  onActionClick: (action: string) => void;
}

const MOCK_EARNINGS_DATA = [
  { name: 'Mon', earnings: 15 },
  { name: 'Tue', earnings: 25 },
  { name: 'Wed', earnings: 45 },
  { name: 'Thu', earnings: 30 },
  { name: 'Fri', earnings: 55 },
  { name: 'Sat', earnings: 70 },
  { name: 'Sun', earnings: 85 }
];

const MOCK_UPCOMING_BOOKINGS = [
  {
    id: 'BKG-2940',
    clientName: 'Alice Mercer',
    serviceName: 'Smart Contract Audit Pro',
    date: '2026-07-28',
    time: '11:00 AM',
    status: 'Confirmed'
  },
  {
    id: 'BKG-2938',
    clientName: 'Bob Sterling',
    serviceName: 'Web3 Consultation Sprint',
    date: '2026-07-28',
    time: '02:00 PM',
    status: 'Pending'
  },
  {
    id: 'BKG-2921',
    clientName: 'Charlotte Webb',
    serviceName: 'dApp Frontend Optimization',
    date: '2026-07-29',
    time: '09:00 AM',
    status: 'In Progress'
  }
];

const MOCK_RECENT_CLIENTS = [
  {
    id: 'c_1',
    name: 'Eleanor Vance',
    lastService: 'Cryptographic Security Audit',
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'c_2',
    name: 'Gregory Peck',
    lastService: 'Vite & Tailwind Integration',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'c_3',
    name: 'Theresa May',
    lastService: 'Solidity Smart Contract Sprint',
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60'
  }
];

const MOCK_TIMELINE = [
  { time: '09:00', title: 'dApp Frontend Optimization Review', client: 'Charlotte Webb', type: 'Active Work' },
  { time: '11:00', title: 'Smart Contract Audit Pro Kickoff', client: 'Alice Mercer', type: 'Introduction Call' },
  { time: '14:00', title: 'Web3 Consultation Sprint Q&A', client: 'Bob Sterling', type: 'Strategic Review' },
  { time: '16:00', title: 'Internal Dev Sync & Pi Network Gas Prep', client: 'Core team', type: 'Operational' }
];

export const ServiceOverview: React.FC<ServiceOverviewProps> = ({ onActionClick }) => {
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'Offline'>('Available');

  return (
    <div className="space-y-10" id="service_provider_overview_container">
      
      {/* SECTION 1: Provider Header */}
      <section id="service_provider_header" className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-850 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Profile Photo */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60" 
                    alt="Provider Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  Dr. Richard Hendricks
                </h1>
                <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> Professional Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Profession: <span className="text-slate-300 font-bold">Web3 & Cryptography Consultant</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                Consensus Provider Signature: CP-8401-A7
              </p>
            </div>
          </div>

          {/* Availability Status Controller */}
          <div className="flex items-center gap-3 self-end md:self-auto bg-slate-950/80 border border-slate-850 p-2 rounded-2xl">
            <div className="px-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Status</span>
              <span className={`text-xs font-black uppercase tracking-wider ${
                availability === 'Available' ? 'text-emerald-400' :
                availability === 'Busy' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {availability}
              </span>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl">
              {(['Available', 'Busy', 'Offline'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setAvailability(status)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    availability === status 
                      ? 'bg-violet-600 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Quick Statistics */}
      <section id="service_statistics_grid" className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
          Workspace Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Services', value: '12', icon: Briefcase, color: 'text-violet-400' },
            { label: 'Active Bookings', value: '4', icon: Clock, color: 'text-indigo-400' },
            { label: 'Completed Jobs', value: '89', icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Pending Requests', value: '2', icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Total Clients', value: '54', icon: Users, color: 'text-cyan-400' },
            { label: 'Average Rating', value: '4.9 / 5.0', icon: Star, color: 'text-amber-400' }
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-black text-white tracking-tight leading-none font-mono">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Quick Actions */}
      <section id="service_quick_actions" className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Add Service', action: 'add_service', icon: Plus, highlight: true },
            { label: 'Manage Services', action: 'manage_services', icon: Briefcase },
            { label: 'Bookings', action: 'bookings', icon: Clock },
            { label: 'Clients', action: 'clients', icon: Users },
            { label: 'Calendar', action: 'calendar', icon: Calendar },
            { label: 'Availability', action: 'availability', icon: Clock },
            { label: 'Pricing', action: 'pricing', icon: DollarSign },
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={() => onActionClick(act.action)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center gap-2.5 transition-all cursor-pointer group select-none ${
                act.highlight 
                  ? 'bg-violet-600 hover:bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-600/10' 
                  : 'bg-slate-900/40 hover:bg-slate-800/80 border-slate-850 text-slate-300 hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${act.highlight ? 'bg-white/10 text-white' : 'bg-slate-950 group-hover:bg-violet-600/10 group-hover:text-violet-400'}`}>
                <act.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {act.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Content: Upcoming Bookings & Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 4: Upcoming Bookings */}
        <section id="service_upcoming_bookings" className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
              Upcoming Bookings
            </h2>
            <button 
              onClick={() => onActionClick('bookings')}
              className="text-[10px] font-black text-violet-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              All Bookings <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="py-4 px-6">Booking ID</th>
                    <th className="py-4 px-6">Client</th>
                    <th className="py-4 px-6">Service Name</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {MOCK_UPCOMING_BOOKINGS.map((bkg) => (
                    <tr key={bkg.id} className="hover:bg-slate-900/20 transition-all text-xs">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-300">
                        {bkg.id}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-200">
                        {bkg.clientName}
                      </td>
                      <td className="py-3.5 px-6 text-slate-300 font-semibold">
                        {bkg.serviceName}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 font-mono">
                        {bkg.date}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 font-mono">
                        {bkg.time}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          bkg.status === 'Confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          bkg.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {bkg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: Recent Clients */}
        <section id="service_recent_clients" className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
              Recent Clients
            </h2>
            <button 
              onClick={() => onActionClick('clients')}
              className="text-[10px] font-black text-violet-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              All Clients
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-xl">
            {MOCK_RECENT_CLIENTS.map((cli) => (
              <div key={cli.id} className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                    <img 
                      src={cli.avatar} 
                      alt={cli.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate leading-tight mb-1">
                      {cli.name}
                    </h4>
                    <span className="text-[9px] text-slate-500 font-semibold truncate block">
                      {cli.lastService}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">
                  <Star className="w-2.5 h-2.5 fill-amber-500" /> {cli.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* SCHEDULE & PERFORMANCE GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 6: Today's Schedule (Timeline view) */}
        <section id="service_today_schedule" className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
            Today's Schedule
          </h2>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[41px] w-0.5 bg-slate-800" />

            {MOCK_TIMELINE.map((time, idx) => (
              <div key={idx} className="flex items-start gap-6 relative z-10">
                <span className="font-mono text-xs font-black text-violet-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
                  {time.time}
                </span>

                <div className="space-y-1.5 min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block leading-none">
                    {time.type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight truncate leading-tight">
                    {time.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Client: <span className="font-bold text-slate-300">{time.client}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: Business Performance */}
        <section id="service_business_performance" className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
            Business Performance
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Today's Earnings", value: '85.0 π', change: '+24%', positive: true },
              { label: 'Weekly Earnings', value: '320.0 π', change: '+12%', positive: true },
              { label: 'Monthly Earnings', value: '1,280.0 π', change: '+8%', positive: true },
              { label: 'Customer Satisfaction', value: '99.4%', change: 'Excellent', positive: true }
            ].map((perf, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-md">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{perf.label}</span>
                  <span className="text-lg font-black text-white font-mono mt-1 block">{perf.value}</span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md w-fit ${perf.positive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {perf.change}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8: Verification Status */}
        <section id="service_verification_status" className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
            Verification
          </h2>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 space-y-6 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-wide">✓ Pi Verified</h4>
                  <p className="text-[8px] text-slate-500 mt-0.5">Consensus member status</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-wide">✓ Service Verified</h4>
                  <p className="text-[8px] text-slate-500 mt-0.5">Certificates & licenses</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                  Approved
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400 uppercase">Profile Completion</span>
                  <span className="font-mono font-black text-violet-400">92%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                  <div className="bg-violet-600 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            <div className="bg-violet-600/5 p-3 rounded-xl border border-violet-500/10 mt-4 text-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Consensus Trust Score</span>
              <span className="text-xl font-mono font-black text-white block mt-1">998 / 1000</span>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
};
