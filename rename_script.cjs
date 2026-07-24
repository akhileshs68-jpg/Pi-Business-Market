const fs = require('fs');
const glob = require('glob');

// We want to replace:
// .logo -> .logoUrl
// .coverImage -> .coverImageUrl
// .banner -> .coverImageUrl
// And for public ID: .logoPublicId, .coverPublicId

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Be careful with replacements, we only want property access and object keys.
  // Using word boundaries.
  // But wait, what about `import Logo from '...'`? We only want to replace property names.
  
  // A safer approach:
  // We can do it manually for Business, Store, and other types.
});
