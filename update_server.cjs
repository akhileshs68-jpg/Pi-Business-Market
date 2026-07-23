const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`    } catch (error: any) {
      console.error("[Cloudinary Upload] Failed:", error);
      res.status(500).json({ 
        error: "Upload to Cloudinary failed",
        details: error.message || String(error)
      });
    }
  });`,
`    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      console.error(error.message);
      res.status(500).json({ 
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
      });
    }
  });`);

fs.writeFileSync('server.ts', code);
