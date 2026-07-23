const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/process\.env\.CLOUDINARY_CLOUD_NAME/g, "(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME)");
code = code.replace(/process\.env\.CLOUDINARY_API_KEY/g, "(process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY)");
// CLOUDINARY_API_SECRET usually doesn't have VITE_, but just in case:
code = code.replace(/process\.env\.CLOUDINARY_API_SECRET/g, "(process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET)");

fs.writeFileSync('server.ts', code);
