const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace('logo?: string;\n  coverImage?: string;', 'logoUrl?: string;\n  logoPublicId?: string;\n  coverImageUrl?: string;\n  coverPublicId?: string;');
content = content.replace('logo?: string;\n  banner?: string;', 'logoUrl?: string;\n  logoPublicId?: string;\n  coverImageUrl?: string;\n  coverPublicId?: string;');
content = content.replace('logo?: string;\n  banner?: string;', 'logoUrl?: string;\n  logoPublicId?: string;\n  coverImageUrl?: string;\n  coverPublicId?: string;');
content = content.replace('banner?: string;', 'coverImageUrl?: string;\n  coverPublicId?: string;');

fs.writeFileSync('src/types.ts', content);
