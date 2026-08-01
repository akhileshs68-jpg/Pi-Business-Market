import re

with open('src/auth/authService.ts', 'r') as f:
    content = f.read()

# Edit loginWithPi to save currentAnonymousUid
old_update_data = """          let updateData: any = {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            piUid,
            username
          };"""

new_update_data = """          let updateData: any = {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            piUid,
            username,
            currentAnonymousUid: firebaseUid
          };"""

content = content.replace(old_update_data, new_update_data)

old_new_user = """          const newUser: any = {
            uid: effectiveUid,
            piUid,
            username,"""

new_new_user = """          const newUser: any = {
            uid: effectiveUid,
            piUid,
            currentAnonymousUid: firebaseUid,
            username,"""

content = content.replace(old_new_user, new_new_user)

# Edit getUserProfile to fallback to currentAnonymousUid
old_get_user = """      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          uid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as User;
      }
      return null;"""

new_get_user = """      let data: any = null;
      let actualUid = uid;

      if (userSnap.exists()) {
        data = userSnap.data();
      } else {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const usersCol = collection(db, 'users');
        const fallbackQ = query(usersCol, where('currentAnonymousUid', '==', uid));
        const fallbackSnap = await getDocs(fallbackQ);
        if (!fallbackSnap.empty) {
          data = fallbackSnap.docs[0].data();
          actualUid = fallbackSnap.docs[0].id;
        }
      }

      if (data) {
        return {
          ...data,
          uid: actualUid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as User;
      }
      return null;"""

content = content.replace(old_get_user, new_get_user)

with open('src/auth/authService.ts', 'w') as f:
    f.write(content)
