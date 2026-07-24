import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
  secure: true
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single("file");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  upload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      if (!req.file.buffer) {
        return res.status(400).json({ success: false, error: "req.file.buffer is undefined. Multer memory storage may be misconfigured." });
      }

      if (!(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME) || 
          !(process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY) || 
          !(process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET)) {
        return res.status(500).json({ 
          success: false,
          error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." 
        });
      }

      const { folder } = req.body;

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder || "general",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto"
          },
          (error, result) => {
            if (error) {
              reject(new Error(error.message || JSON.stringify(error)));
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer);
      });

      res.status(200).json({
        success: true,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: uploadResult.resource_type || "image",
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      });
    } catch (error: any) {
      console.error("[Upload] Failed:", error);
      res.status(500).json({
        success: false,
        error: error.message || String(error)
      });
    }
  });
}
