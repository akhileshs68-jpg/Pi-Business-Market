const fs = require('fs');

// 1. server.ts - req.file.buffer at 131
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace('stream.end(req.file.buffer);', 'stream.end(req.file!.buffer);');
fs.writeFileSync('server.ts', serverCode);

// 2. DocumentManager.tsx - 'business' -> 'businesses'
let dmCode = fs.readFileSync('src/components/business/DocumentManager.tsx', 'utf8');
dmCode = dmCode.replace(/'business'/g, "'businesses'");
fs.writeFileSync('src/components/business/DocumentManager.tsx', dmCode);

// 3. BusinessProfile.tsx - 'business' -> 'businesses' in uploadMedia
let bpCode = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');
bpCode = bpCode.replace(/module: 'business'/g, "module: 'businesses'");
fs.writeFileSync('src/pages/BusinessProfile.tsx', bpCode);

// 4. MediaLibrary.tsx - formatBytes
let mlCode = fs.readFileSync('src/components/product/MediaLibrary.tsx', 'utf8');
mlCode = mlCode.replace(/mediaService\.formatBytes/g, "formatBytes");
if (!mlCode.includes('const formatBytes =')) {
  mlCode = mlCode.replace(
    'const MediaLibrary: React.FC<MediaLibraryProps> = ({',
    'const formatBytes = (bytes: number) => { if (bytes === 0) return "0 Bytes"; const k = 1024; const sizes = ["Bytes", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]; };\n\nconst MediaLibrary: React.FC<MediaLibraryProps> = ({'
  );
}
fs.writeFileSync('src/components/product/MediaLibrary.tsx', mlCode);

// 5. InventoryDashboard.tsx - setError
let idCode = fs.readFileSync('src/pages/InventoryDashboard.tsx', 'utf8');
if (!idCode.includes('const [error, setError] = useState<string | null>(null);', 0)) {
  idCode = idCode.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);'
  );
}
// Remove duplicate inside StockAdjustModal if it exists and causes issues, actually they are in different components so it's fine. Wait, if we added error to InventoryDashboard, we shouldn't have duplicate declarations in the same scope. The patch script added `setError(null)` to `loadData`.
fs.writeFileSync('src/pages/InventoryDashboard.tsx', idCode);

