const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(/business\.logo/g, 'business.logoUrl');
code = code.replace(/business\.coverImage/g, 'business.coverImageUrl');
code = code.replace(/editForm\.logo/g, 'editForm.logoUrl');
code = code.replace(/editForm\.coverImage/g, 'editForm.coverImageUrl');

code = code.replace(
  `                            logo: finalLogo,\n                            coverImage: finalCover`,
  `                            logoUrl: finalLogo,\n                            logoPublicId: finalLogoId,\n                            coverImageUrl: finalCover,\n                            coverPublicId: finalCoverId`
);

code = code.replace(
  `logo: finalLogo, coverImage: finalCover } as Business : null);`,
  `logoUrl: finalLogo, logoPublicId: finalLogoId, coverImageUrl: finalCover, coverPublicId: finalCoverId } as Business : null);`
);

// We need to fetch and set public ids
code = code.replace(
  'let finalLogo = editForm.logoUrl;\n                        let finalCover = editForm.coverImageUrl;',
  'let finalLogo = editForm.logoUrl;\n                        let finalLogoId = business.logoPublicId || undefined;\n                        let finalCover = editForm.coverImageUrl;\n                        let finalCoverId = business.coverPublicId || undefined;'
);

code = code.replace(
  `finalLogo = logoAsset.downloadUrl;`,
  `finalLogo = logoAsset.downloadUrl;\n                          finalLogoId = logoAsset.storagePath;`
);

code = code.replace(
  `finalCover = coverAsset.downloadUrl;`,
  `finalCover = coverAsset.downloadUrl;\n                          finalCoverId = coverAsset.storagePath;`
);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
