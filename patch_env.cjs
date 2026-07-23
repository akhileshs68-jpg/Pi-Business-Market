const fs = require('fs');
let code = fs.readFileSync('.env.example', 'utf8');

code = code.replace(
`# ==========================================
# CLOUDINARY MEDIA CONFIGURATION
# ==========================================
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VITE_CLOUDINARY_UPLOAD_PRESET=`,
`# ==========================================
# CLOUDINARY MEDIA CONFIGURATION
# ==========================================
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=`
);

fs.writeFileSync('.env.example', code);
