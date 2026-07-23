const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

// Add error state
if (!code.includes('const [updateError, setUpdateError]')) {
  code = code.replace(
    "const [saving, setSaving] = useState(false);",
    "const [saving, setSaving] = useState(false);\n  const [updateError, setUpdateError] = useState<string | null>(null);"
  );
}

// Render error in the modal
if (!code.includes('updateError &&')) {
  code = code.replace(
    '<div className="p-6 md:p-8 overflow-y-auto">',
    '<div className="p-6 md:p-8 overflow-y-auto">\n                {updateError && (\n                  <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">\n                    <AlertCircle className="w-4 h-4 shrink-0" />\n                    {updateError}\n                  </div>\n                )}'
  );
  
  // Make sure to import AlertCircle if not imported
  if (!code.includes('AlertCircle')) {
    code = code.replace(
      'X, Camera, Building2, MapPin',
      'X, Camera, Building2, MapPin, AlertCircle'
    );
  }
}

// Replace alert
code = code.replace(
  "alert('Update failed: ' + (err instanceof Error ? err.message : String(err)));",
  "setUpdateError('Update failed: ' + (err instanceof Error ? err.message : String(err)));"
);

// Clear error on save
code = code.replace(
  "setSaving(true);",
  "setSaving(true);\n                      setUpdateError(null);"
);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
