const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductManagement.tsx', 'utf8');

if (!code.includes('const [error, setError] = useState')) {
  code = code.replace(
    "const [products, setProducts] = useState<Product[]>([]);",
    "const [products, setProducts] = useState<Product[]>([]);\n  const [error, setError] = useState<string | null>(null);"
  );
  
  code = code.replace(
    '<div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">',
    '{error && (\n        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">\n          <AlertCircle className="w-4 h-4 shrink-0" />\n          {error}\n          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">Dismiss</button>\n        </div>\n      )}\n      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">'
  );
  
  if (!code.includes('AlertCircle')) {
    code = code.replace(
      'Search, Plus, Filter, LayoutGrid, List, MoreVertical, Edit2, Copy, Trash2',
      'Search, Plus, Filter, LayoutGrid, List, MoreVertical, Edit2, Copy, Trash2, AlertCircle'
    );
  }
  
  code = code.replace(
    "alert('Failed to delete product: ' + err.message);",
    "setError('Failed to delete product: ' + err.message);"
  );
  
  code = code.replace(
    "alert('Failed to duplicate product: ' + err.message);",
    "setError('Failed to duplicate product: ' + err.message);"
  );
}

fs.writeFileSync('src/pages/ProductManagement.tsx', code);
