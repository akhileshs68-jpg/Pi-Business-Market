const fs = require('fs');
let serverStr = fs.readFileSync('server.ts', 'utf8');

const startUpload = serverStr.indexOf('// Cloudinary Backend Upload Endpoint');
const endUpload = serverStr.indexOf('// Vite middleware for development');

if (startUpload !== -1 && endUpload !== -1) {
  serverStr = serverStr.substring(0, startUpload) + serverStr.substring(endUpload);
  fs.writeFileSync('server.ts', serverStr);
} else {
  console.log("Could not find blocks");
}
