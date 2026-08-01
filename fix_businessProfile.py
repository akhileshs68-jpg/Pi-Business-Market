import re

with open('src/pages/BusinessProfile.tsx', 'r') as f:
    content = f.read()

# Replace the else if (user) block
old_block = '''        } else if (user) {
          // No ID provided, try to load current user's profile for their active role
          const activeRole = (user as any).activeRole ? String((user as any).activeRole).toLowerCase() : 'seller';
          const data = await businessProfileService.getProfile(user.uid, activeRole);
          if (data) {
            setProfileData(data);
            setIsEditing(true); // Default to edit mode if no ID was specified and it's theirs
          } else {
            // New profile for this role
            setProfileData({ businessType: activeRole });
            setIsEditing(true);
          }
        }'''
new_block = '''        } else {
          console.error("No ID provided for BusinessProfile");
        }'''

content = content.replace(old_block, new_block)

# And in handleSave, it uses activeRole. Since it's only for existing IDs now, we don't need activeRole.
# Actually, if we're only updating, we don't even need `saveProfile` with `activeRole`.
# Let's check `handleSave`
old_save = '''    try {
      const activeRole = (user as any).activeRole ? String((user as any).activeRole).toLowerCase() : 'seller';
      const newId = await businessProfileService.saveProfile(user.uid, activeRole, data, publish);
      // Reload'''

new_save = '''    try {
      if (!id) throw new Error("Cannot save profile without an ID");
      const newId = await businessProfileService.saveProfile(user.uid, profileData?.businessType || 'seller', data, publish);
      // Reload'''

content = content.replace(old_save, new_save)

with open('src/pages/BusinessProfile.tsx', 'w') as f:
    f.write(content)
