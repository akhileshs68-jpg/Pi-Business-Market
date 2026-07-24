const fs = require('fs');

const deleteRoute = `
  // Cloudinary Backend Delete Endpoint
  app.delete("/api/upload/:publicId(*)", async (req, res) => {
    try {
      const { publicId } = req.params;
      if (!publicId) {
        return res.status(400).json({ error: "Public ID is required" });
      }

      if (!(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME) || !(process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY) || !(process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET)) {
        return res.status(500).json({ 
          error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." 
        });
      }

      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("[Cloudinary Delete] Failed:", error);
      res.status(500).json({ 
        success: false,
        error: "Deletion from Cloudinary failed: " + (error.message || String(error)),
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
      });
    }
  });

`;

let serverFile = fs.readFileSync('server.ts', 'utf8');
if (!serverFile.includes('app.delete("/api/upload/:publicId(*)"')) {
  serverFile = serverFile.replace('// Vite middleware for development', deleteRoute + '  // Vite middleware for development');
  fs.writeFileSync('server.ts', serverFile);
}
