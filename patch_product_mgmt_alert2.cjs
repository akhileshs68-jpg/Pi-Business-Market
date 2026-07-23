const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductManagement.tsx', 'utf8');

code = code.replace(
  "alert('Failed to delete product: ' + err.message);",
  "setError('Failed to delete product: ' + err.message);"
);

code = code.replace(
  "alert('Failed to duplicate product: ' + err.message);",
  "setError('Failed to duplicate product: ' + err.message);"
);

fs.writeFileSync('src/pages/ProductManagement.tsx', code);
