const fs = require('fs');
let content = fs.readFileSync('src/services/messagingService.ts', 'utf8');

content = content.replace(
  "import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp, getDoc, limit, startAfter } from 'firebase/firestore';",
  "import { collection, doc, setDoc, updateDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp, getDoc, limit, startAfter } from 'firebase/firestore';\nimport { aiEngineService } from './aiEngineService';"
);

const modCheck = `
    // AI CONTENT MODERATION
    if (type === 'text' && content) {
      const moderation = await aiEngineService.moderateContent(content, 'message');
      if (!moderation.isSafe) {
        throw new Error('CONTENT_MODERATION: ' + moderation.reason);
      }
    }
`;

content = content.replace(
  "// 1. RATE LIMITING & FLOOD PROTECTION",
  modCheck + "\n    // 1. RATE LIMITING & FLOOD PROTECTION"
);

fs.writeFileSync('src/services/messagingService.ts', content);
