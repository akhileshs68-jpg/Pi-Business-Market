import sys

with open("server.ts", "r") as f:
    content = f.read()

# Replacement 1
content = content.replace("            const paymentDocId = `PAY_${paymentId}`;", "            const paymentDocId = metadata?.internalPaymentId || `PAY_${paymentId}`;")

# Replacement 2
content = content.replace("      const paymentDocId = `PAY_${paymentId}`;", "      const paymentDocId = metadata?.internalPaymentId || `PAY_${paymentId}`;")

with open("server.ts", "w") as f:
    f.write(content)

print("Patched server.ts")
