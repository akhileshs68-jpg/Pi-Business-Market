const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ success: true, result });`,
`      if (!process.env.VITE_CLOUDINARY_CLOUD_NAME || !process.env.VITE_CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("Cloudinary not configured, mocking delete");
        return res.json({ success: true, result: "mocked" });
      }
      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ success: true, result });`
);

fs.writeFileSync('server.ts', code);
