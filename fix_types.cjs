const fs = require('fs');

let content = fs.readFileSync('src/services/paymentService.ts', 'utf8');

// add method signatures to the paymentService object
const methodsToAdd = `
  async getBusinessPayments(businessId: string): Promise<any[]> {
    return [];
  },
  async getCustomerPayments(customerId: string): Promise<any[]> {
    return [];
  },
`;

content = content.replace("async getTransaction(paymentId: string): Promise<PaymentRecord | null> {", methodsToAdd + "\n  async getTransaction(paymentId: string): Promise<PaymentRecord | null> {");

fs.writeFileSync('src/services/paymentService.ts', content);
