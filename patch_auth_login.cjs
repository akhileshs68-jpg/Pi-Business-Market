const fs = require('fs');
let s = fs.readFileSync('src/auth/authService.ts', 'utf8');

// Inside loginWithPi, after updateDoc
s = s.replace(/await updateDoc\(userRef, \{\n\s*lastLoginAt:/g, "await this.trackSession(piUser.uid);\n        await updateDoc(userRef, {\n          lastLoginAt:");

// Inside registerWithPi, after setDoc
s = s.replace(/await setDoc\(userRef, newUser\);/g, "await setDoc(userRef, newUser);\n        await this.trackSession(piUser.uid);");

fs.writeFileSync('src/auth/authService.ts', s);
