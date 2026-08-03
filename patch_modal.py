import sys

with open("src/components/payment/PiInAppPaymentModal.tsx", "r") as f:
    content = f.read()

target = """    const metadata = {
      orderId,
      buyerId: user.uid
    };

    try {
      await paymentService.processPiPayment("""

replacement = """    const metadata = {
      sessionId: orderId,
      orderId,
      buyerId: user.uid,
      sellerId: "admin",
      businessId: "PLATFORM",
      storeId: "IN_APP"
    };

    try {
      await paymentService.processPiPayment("""

if target in content:
    content = content.replace(target, replacement)
    with open("src/components/payment/PiInAppPaymentModal.tsx", "w") as f:
        f.write(content)
    print("Patched PiInAppPaymentModal")
else:
    print("Target not found PiInAppPaymentModal")

