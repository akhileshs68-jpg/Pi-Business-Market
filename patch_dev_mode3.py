import sys

with open("server.ts", "r") as f:
    content = f.read()

target = """          const { initializeFirestore } = await import("firebase/firestore");
          const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
          let clientDb;
          try {
            clientDb = databaseId ? initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, databaseId) : initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
          } catch(e) {
            clientDb = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);
          }"""

replacement = """          const { getFirestore, doc, setDoc, updateDoc, getDoc, serverTimestamp } = await import("firebase/firestore/lite");
          const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
          const clientDb = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);"""

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Patched dev mode with firestore/lite.")
else:
    print("Target not found.")

