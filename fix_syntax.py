import sys

with open("server.ts", "r") as f:
    content = f.read()

target = "      let skipDatabase = false;\n      if (getApps().length > 0 if (getApps().length > 0 && paymentRef) {if (getApps().length > 0 && paymentRef) { paymentRef) {"

replacement = "      let skipDatabase = false;\n      if (getApps().length > 0 && paymentRef) {"

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Fixed syntax.")
else:
    print("Target not found. Doing manual replace.")
    import re
    content = re.sub(r'let skipDatabase = false;\s+if \(getApps\(\)\.length > 0 if \(getApps\(\)\.length > 0 && paymentRef\) \{if \(getApps\(\)\.length > 0 && paymentRef\) \{ paymentRef\) \{', replacement, content)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Fixed syntax regex.")
