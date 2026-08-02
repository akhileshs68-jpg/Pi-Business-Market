const fs = require('fs');
let file = fs.readFileSync('src/components/admin/MissionControlPanels.tsx', 'utf8');

const regex = /export const SecurityCenterPanel = \(\) => \([\s\S]*?(?=export const BackupRecoveryPanel)/;
const replacement = `export const SecurityCenterPanel = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [fraud, setFraud] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [e, f] = await Promise.all([
          zeroTrustService.getSecurityEvents(20),
          fraudDetectionService.getFraudSignals(20)
        ]);
        setEvents(e);
        setFraud(f);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-rose-500/20 rounded-xl"><ShieldAlert className="w-6 h-6 text-rose-400" /></div>
      <h3 className="text-xl font-bold text-white">Security Center</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Total Events</h4>
          <span className="text-2xl font-black text-white">{events.length}</span>
        </div>
        <AlertCircle className="w-8 h-8 text-amber-500/50" />
      </div>
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Fraud Signals</h4>
          <span className="text-2xl font-black text-white">{fraud.length}</span>
        </div>
        <ShieldAlert className="w-8 h-8 text-rose-500/50" />
      </div>
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Active Threats</h4>
          <span className="text-2xl font-black text-white">{events.filter(e => e.severity === 'critical').length}</span>
        </div>
        <Trash2 className="w-8 h-8 text-slate-500/50" />
      </div>
    </div>
    
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
       <h4 className="text-sm font-bold text-white mb-4">Recent Security Alerts</h4>
       <div className="space-y-3">
         {loading ? (
            <div className="text-sm text-slate-500 text-center py-4">Loading security logs...</div>
         ) : events.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No recent security events detected. Zero Trust perimeter is secure.</div>
         ) : events.map(e => (
            <div key={e.eventId} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldAlert className={\`w-4 h-4 \${e.severity === 'critical' ? 'text-rose-500' : e.severity === 'high' ? 'text-orange-500' : 'text-amber-400'}\`} />
                <span className="text-sm text-slate-300">{e.eventType}: {JSON.stringify(e.details)}</span>
              </div>
              <span className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
         ))}
       </div>
    </div>
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
       <h4 className="text-sm font-bold text-white mb-4">Fraud Signals</h4>
       <div className="space-y-3">
         {loading ? (
            <div className="text-sm text-slate-500 text-center py-4">Loading fraud signals...</div>
         ) : fraud.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No fraud signals detected.</div>
         ) : fraud.map(f => (
            <div key={f.signalId} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-300">Target: {f.targetType} - {f.reason} (Conf: {Math.round(f.confidenceScore * 100)}%)</span>
              </div>
              <span className="text-xs text-slate-500">{new Date(f.timestamp).toLocaleString()}</span>
            </div>
         ))}
       </div>
    </div>
  </div>
);
`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/components/admin/MissionControlPanels.tsx', file);
