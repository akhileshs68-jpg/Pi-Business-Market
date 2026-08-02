const fs = require('fs');
let file = fs.readFileSync('src/components/admin/MissionControlPanels.tsx', 'utf8');

const regex = /export const BackupRecoveryPanel = \(\) => \([\s\S]*?\);\n/g;
const replacement = `export const BackupRecoveryPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await backupRecoveryService.triggerManualBackup(user.uid, user.displayName || 'Admin');
      alert('Manual backup triggered and completed successfully. (Simulation)');
    } catch (err) {
      console.error(err);
      alert('Failed to trigger backup');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-indigo-500/20 rounded-xl"><Database className="w-6 h-6 text-indigo-400" /></div>
      <h3 className="text-xl font-bold text-white">Backup & Disaster Recovery</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-base font-bold text-white mb-2">Firestore Database</h4>
        <p className="text-xs text-slate-400 mb-6">Automated daily backups are active. Retained for 30 days.</p>
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase">Last Backup: Success</div>
            <div className="text-[10px] text-slate-500 mt-1">Today, 03:00 UTC</div>
          </div>
          <button 
            onClick={handleBackup}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md"
          >
            {loading ? 'Running...' : 'Manual Backup'}
          </button>
        </div>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-base font-bold text-white mb-2">Cloud Storage</h4>
        <p className="text-xs text-slate-400 mb-6">Object storage replication across multi-region.</p>
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase">Replication: Active</div>
            <div className="text-[10px] text-slate-500 mt-1">Synced across us-central1, asia-southeast1</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
`;

file = file.replace(regex, replacement);
fs.writeFileSync('src/components/admin/MissionControlPanels.tsx', file);
