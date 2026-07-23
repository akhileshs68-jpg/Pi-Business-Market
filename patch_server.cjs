const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder || "general",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto"
          },
          (error, result) => {
            if (error) {
              console.error("[Cloudinary Stream Error]:", error);
              reject(error);
            }
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });`,
`      console.log("[Server] Uploading to Cloudinary...");
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
                console.error("[Cloudinary Stream Error Callback]:", error);
                reject(new Error(error.message || JSON.stringify(error)));
              }
              else resolve(result);
            }
          );
          stream.end(req.file!.buffer);
        } catch (syncError) {
          console.error("[Cloudinary Stream Sync Error]:", syncError);
          reject(syncError);
        }
      });
      console.log("[Server] Upload success:", uploadResult.public_id);`
);

fs.writeFileSync('server.ts', code);
