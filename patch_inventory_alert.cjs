const fs = require('fs');
let code = fs.readFileSync('src/pages/InventoryDashboard.tsx', 'utf8');

if (!code.includes('const [error, setError] = useState')) {
  code = code.replace(
    "const [loading, setLoading] = useState(false);",
    "const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);"
  );
  
  code = code.replace(
    '<div className="p-6">',
    '<div className="p-6">\n          {error && (\n            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">\n              {error}\n            </div>\n          )}'
  );
  
  code = code.replace(
    "alert(err.message);",
    "setError(err.message || 'Failed to adjust stock');"
  );
  
  code = code.replace(
    "setLoading(true);",
    "setLoading(true);\n      setError(null);"
  );
}

fs.writeFileSync('src/pages/InventoryDashboard.tsx', code);
