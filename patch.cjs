const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(
`                    onClick={async () => {
                      if (!user) return;
                      setSaving(true);
                      try {
                        let finalLogo = editForm.logo;
                        let finalCover = editForm.coverImage;
                        
                        if (logoFile) {
                          const logoAsset = await mediaService.uploadMedia(logoFile, user.uid, {
                            module: 'business',
                            businessId: business.businessId,
                          });
                          finalLogo = logoAsset.downloadUrl;
                        }

                        if (coverFile) {
                          const coverAsset = await mediaService.uploadMedia(coverFile, user.uid, {
                            module: 'business',
                            businessId: business.businessId,
                          });
                          finalCover = coverAsset.downloadUrl;
                        }
                        
                        await businessService.updateBusiness(business.businessId, {
                          businessName: editForm.businessName,
                          city: editForm.city,
                          country: editForm.country,
                          logo: finalLogo,
                          coverImage: finalCover
                        });
                        
                        setBusiness(prev => prev ? { ...prev, ...editForm, logo: finalLogo, coverImage: finalCover } as Business : null);
                        setIsEditModalOpen(false);
                      } catch (err) {
                        console.error('Update failed', err);
                        alert('Update failed');
                      } finally {
                        setSaving(false);
                      }
                    }}`,
`                    onClick={async () => {
                      if (!user || !business) {
                        console.error('User or business not found', { user, business });
                        return;
                      }
                      
                      console.log('Step 1 completed: User clicked Save');
                      setSaving(true);
                      
                      try {
                        let finalLogo = editForm.logo;
                        let finalCover = editForm.coverImage;
                        
                        console.log('Step 2 completed: Starting uploads if needed');
                        
                        if (logoFile) {
                          console.log('Uploading logo...', logoFile.name);
                          const logoAsset = await mediaService.uploadMedia(logoFile, user.uid, {
                            module: 'business',
                            businessId: business.id,
                          });
                          finalLogo = logoAsset.downloadUrl;
                          console.log('Step 3 completed: Logo uploaded', finalLogo);
                        }

                        if (coverFile) {
                          console.log('Uploading cover...', coverFile.name);
                          const coverAsset = await mediaService.uploadMedia(coverFile, user.uid, {
                            module: 'business',
                            businessId: business.id,
                          });
                          finalCover = coverAsset.downloadUrl;
                          console.log('Step 4 completed: Cover uploaded', finalCover);
                        }
                        
                        console.log('Step 5 completed: Calling updateBusiness with ID:', business.id);
                        
                        await businessService.updateBusiness(
                          business.id,
                          user.uid,
                          user.displayName || user.email || 'Unknown User',
                          {
                            businessName: editForm.businessName,
                            city: editForm.city,
                            country: editForm.country,
                            logo: finalLogo,
                            coverImage: finalCover
                          }
                        );
                        
                        console.log('Step 6 completed: Firestore update successful');
                        
                        setBusiness(prev => prev ? { ...prev, ...editForm, logo: finalLogo, coverImage: finalCover } as Business : null);
                        console.log('Step 7 completed: Refreshed local profile state');
                        
                        setIsEditModalOpen(false);
                        console.log('Step 8 completed: Closed dialog');
                        
                      } catch (err) {
                        console.error('Save workflow failed:', err);
                        if (err instanceof Error) {
                          console.error('Stack trace:', err.stack);
                        }
                        alert('Update failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setSaving(false);
                        console.log('Finally block executed: setSaving(false)');
                      }
                    }}`
);

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
