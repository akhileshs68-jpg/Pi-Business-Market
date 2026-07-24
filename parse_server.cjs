const fs = require('fs');

const serverFile = fs.readFileSync('server.ts', 'utf8');

const startUpload = serverFile.indexOf('// Cloudinary Backend Upload Endpoint');
const endUpload = serverFile.indexOf('// Vite middleware for development');

const uploadCode = serverFile.substring(startUpload, endUpload);
fs.writeFileSync('upload_code.ts', uploadCode);
