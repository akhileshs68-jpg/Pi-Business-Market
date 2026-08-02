const fs = require('fs');
let content = fs.readFileSync('src/services/reviewService.ts', 'utf8');

content = content.replace(
  "import { getFirebaseDb } from '../firebase/config';",
  "import { getFirebaseDb } from '../firebase/config';\nimport { aiEngineService } from './aiEngineService';"
);

const modCheck = `
    // AI CONTENT MODERATION for Reviews
    if (review.comment) {
      const moderation = await aiEngineService.moderateContent(review.comment, 'review');
      if (!moderation.isSafe) {
        throw new Error('CONTENT_MODERATION: ' + moderation.reason);
      }
    }
`;

content = content.replace(
  "const reviewId = `REV_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;",
  "const reviewId = `REV_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;\n" + modCheck
);

fs.writeFileSync('src/services/reviewService.ts', content);
