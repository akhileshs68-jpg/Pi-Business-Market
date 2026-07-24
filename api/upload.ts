import "dotenv/config";
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME),
  api_key: (process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY),
  api_secret: (process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET),
  secure: true
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();
app.use(express.json());

// Cloudinary Backend Upload Endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  let currentStep = "Request received";
  console.log(`[Upload] ✓ ${currentStep}`);
  try {
    if (!req.file) {
      currentStep = "File received - FAILED (No file)";
      console.error(`[Upload] ✗ ${currentStep}`);
      return res.status(400).json({ 
        success: false, 
        step: "File received",
        error: "No file uploaded" 
      });
    }

    currentStep = "File received";
    console.log(`[Upload] ✓ ${currentStep}`);

    if (!req.file.buffer) {
      currentStep = "Buffer size - FAILED (Buffer is undefined)";
      console.error(`[Upload] ✗ ${currentStep}`);
      return res.status(400).json({
        success: false,
        step: "Buffer size",
        error: "req.file.buffer is undefined. Multer memory storage may be misconfigured."
      });
    }

    currentStep = "Buffer size";
    console.log(`[Upload] ✓ ${currentStep} (${req.file.buffer.length} bytes)`);

    if (!(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME) || !(process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY) || !(process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET)) {
      currentStep = "Cloudinary initialized - FAILED (Missing env vars)";
      console.error(`[Upload] ✗ ${currentStep}`);
      return res.status(500).json({ 
        success: false,
        step: "Cloudinary initialized",
        error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables." 
      });
    }

    currentStep = "Cloudinary initialized";
    console.log(`[Upload] ✓ ${currentStep}`);

    const { folder } = req.body;
    
    currentStep = "Upload started";
    console.log(`[Upload] ✓ ${currentStep}`);

    const uploadResult: any = await new Promise((resolve, reject) => {
      try {
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
            }
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      } catch (err: any) {
        reject(err);
      }
    });

    currentStep = "Upload completed";
    console.log(`[Upload] ✓ ${currentStep}`);

    res.json({
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
    console.error(`[Upload] ✗ Failed at step: ${currentStep}`, error);
    res.status(500).json({ 
      success: false,
      step: currentStep,
      error: error.message || String(error),
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
    });
  }
});

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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
