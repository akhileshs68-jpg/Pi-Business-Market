const fs = require('fs');
let code = fs.readFileSync('.env', 'utf8');

code = code.replace(/VITE_CLOUDINARY_CLOUD_NAME/g, 'CLOUDINARY_CLOUD_NAME');
code = code.replace(/VITE_CLOUDINARY_API_KEY/g, 'CLOUDINARY_API_KEY');
code = code.replace(/VITE_CLOUDINARY_UPLOAD_PRESET=/g, '');

fs.writeFileSync('.env', code);
