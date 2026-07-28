const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// Add import for PaymentSelector and PaymentMethodId
if (!content.includes('PaymentSelector')) {
  content = content.replace("import { CheckoutInput } from '../components/checkout/CheckoutInput';", "import { CheckoutInput } from '../components/checkout/CheckoutInput';\nimport { PaymentSelector } from '../components/PaymentSelector';\nimport { PaymentMethodId } from '../types/payment';");
}

// Add state for selectedPaymentMethod
if (!content.includes('selectedPaymentMethod')) {
  content = content.replace("const [address, setAddress] = useState<Address>(", "const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('pi');\n  const [address, setAddress] = useState<Address>(");
}

// Modify step === 'payment' render logic
const oldPaymentRender = `<div className="p-6 md:p-8 bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase mb-2">Pi Wallet</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-6 sm:mb-8 max-w-xs mx-auto leading-relaxed">Securely authorize transaction via Pi Browser or Wallet app.</p>
                    <div className="px-4 md:px-6 py-4 bg-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">PI</div>
                        <span className="text-[11px] sm:text-sm font-bold text-slate-300">Balance available</span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-white">1,240.50 Pi</span>
                    </div>
                  </div>`;
const newPaymentRender = `<PaymentSelector selectedMethod={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />`;

content = content.replace(oldPaymentRender, newPaymentRender);

// Replace "Pi Network Wallet" in review step with dynamic name
content = content.replace(`<p className="text-sm font-bold text-white">Pi Network Wallet</p>`, `{selectedPaymentMethod === 'pi' ? <p className="text-sm font-bold text-white">Pi Network Wallet</p> : <p className="text-sm font-bold text-white text-transform-capitalize">{selectedPaymentMethod}</p>}`);

fs.writeFileSync('src/pages/Checkout.tsx', content);
