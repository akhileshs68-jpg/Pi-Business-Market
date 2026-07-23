const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  '      res.status(500).json({ error: "Deletion from Cloudinary failed" });',
  '      res.status(500).json({ \n        success: false,\n        error: "Deletion from Cloudinary failed: " + (error.message || String(error)),\n        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined\n      });'
);

fs.writeFileSync('server.ts', code);
