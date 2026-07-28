import re

with open("src/services/businessProfileService.ts", "r") as f:
    text = f.read()

# Replace getProfile
new_get_profile = """  async getProfile(ownerUid: string, roleId: string) {
    const db = getFirebaseDb();
    
    // First try the legacy way just in case
    let q = query(
      collection(db, 'businesses'),
      where('ownerUid', '==', ownerUid),
      where('businessType', '==', roleId)
    );
    let snap = await getDocs(q);
    
    if (snap.empty) {
      // Fallback: Just find ANY business owned by this user
      q = query(
        collection(db, 'businesses'),
        where('ownerUid', '==', ownerUid)
      );
      snap = await getDocs(q);
    }
    
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    
    // Also check legacy businessProfiles collection just in case
    const legacyQ = query(collection(db, 'businessProfiles'), where('ownerUid', '==', ownerUid));
    const legacySnap = await getDocs(legacyQ);
    if (!legacySnap.empty) {
      return { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
    }

    return null;
  },"""

text = re.sub(r"async getProfile\(ownerUid: string, roleId: string\) \{[\s\S]*?return null;\n  \},", new_get_profile, text)

with open("src/services/businessProfileService.ts", "w") as f:
    f.write(text)
