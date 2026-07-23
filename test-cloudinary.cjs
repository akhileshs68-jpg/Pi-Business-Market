const multer = require('multer');
const express = require('express');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: 'test',
  api_key: 'test',
  api_secret: 'test',
  secure: true
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { folder } = req.body;
    
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "general",
          resource_type: "auto",
          quality: "auto",
          fetch_format: "auto"
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    console.error(error.stack);
    console.error(error.message);
    res.status(500).json({ 
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
    });
  }
});

const request = require('supertest');

request(app)
  .post('/api/upload')
  .attach('file', Buffer.from('test'), 'test.txt')
  .expect(500)
  .end((err, res) => {
    if (err) console.error(err);
    console.log(res.body);
  });
