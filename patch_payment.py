import sys

with open("src/services/paymentService.ts", "r") as f:
    content = f.read()

target = """  async processPiPayment(
    paymentId: string, 
    amount: number, 
    memo: string,
    metadata: any,
    onSuccess: (txid: string) => void,
    onError: (err: string) => void
  ) {
    console.log('[PaymentService] Payment Created - Starting processPiPayment. Payment ID:', paymentId);"""

replacement = """  async processPiPayment(
    paymentId: string, 
    amount: number, 
    memo: string,
    metadata: any,
    onSuccess: (txid: string) => void,
    onError: (err: string) => void
  ) {
    console.log('[PaymentService] Payment Created - Starting processPiPayment. Payment ID:', paymentId);

    metadata.internalPaymentId = paymentId;

    const requiredMetadata = ['sessionId', 'buyerId', 'sellerId', 'businessId', 'storeId', 'orderId'];
    for (const key of requiredMetadata) {
      if (!metadata[key]) {
        console.error(`[PaymentService] Missing mandatory metadata field: ${key}`);
        onError(`Missing mandatory metadata field: ${key}`);
        return;
      }
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/services/paymentService.ts", "w") as f:
        f.write(content)
    print("Patched processPiPayment")
else:
    print("Target not found")
