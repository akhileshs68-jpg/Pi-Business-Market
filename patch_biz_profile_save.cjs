const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(
  /await businessService\.updateBusiness\([\s\S]*?\);/,
  `const updatePayload = {
                            businessName: editForm.businessName,
                            city: editForm.city,
                            country: editForm.country,
                            logoUrl: finalLogo,
                            logoPublicId: finalLogoId,
                            coverImageUrl: finalCover,
                            coverPublicId: finalCoverId
                          };
                        console.log('Firestore payload:', updatePayload);

                        await businessService.updateBusiness(
                          business.id,
                          user.uid,
                          user.displayName || user.email || 'Unknown User',
                          updatePayload
                        );`
);

code = code.replace(
  `setBusiness(prev => prev ? { ...prev, ...editForm, logoUrl: finalLogo, logoPublicId: finalLogoId, coverImageUrl: finalCover, coverPublicId: finalCoverId } as Business : null);`,
  `// Refresh local state and fetch latest
                        const updatedBiz = await businessService.getBusiness(business.id);
                        console.log('Firestore document after update:', updatedBiz);
                        setBusiness(updatedBiz);`
);

code = code.replace(
  /finalLogo = logoAsset.downloadUrl;\n                          finalLogoId = logoAsset.storagePath;/,
  `finalLogo = logoAsset.downloadUrl;
                          finalLogoId = logoAsset.storagePath;
                          console.log('Returned Cloudinary URL (Logo):', finalLogo);`
);

code = code.replace(
  /finalCover = coverAsset.downloadUrl;\n                          finalCoverId = coverAsset.storagePath;/,
  `finalCover = coverAsset.downloadUrl;
                          finalCoverId = coverAsset.storagePath;
                          console.log('Returned Cloudinary URL (Cover):', finalCover);`
);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
