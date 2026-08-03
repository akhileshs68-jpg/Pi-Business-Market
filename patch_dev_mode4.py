import sys

with open("server.ts", "r") as f:
    content = f.read()

target = """          const { initializeApp, getApps, getApp } = await import("firebase/app");
          const { getFirestore, doc, setDoc, updateDoc, getDoc, serverTimestamp } = await import("firebase/firestore");"""

replacement = """          const { initializeApp, getApps, getApp } = await import("firebase/app");
          // Replaced firestore import"""

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Patched redundant import.")
else:
    print("Target not found.")

