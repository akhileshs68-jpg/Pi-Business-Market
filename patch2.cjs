const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /catch\s*\(\s*error\s*:\s*any\s*\)\s*\{[\s\S]*?res\.status\(500\)\.json\(\{[\s\S]*?\}\);?\s*\}/;

const replacement = `catch (error: any) {
      console.error(error);
      console.error(error.stack);
      console.error(error.message);
      res.status(500).json({ 
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined
      });
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
