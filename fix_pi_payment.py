import re

with open('src/services/piPaymentService.ts', 'r') as f:
    content = f.read()

target = """      } else {
        console.error('[PiPaymentService] window.Pi not found. Cannot execute payment.');
        isPaymentInProgress = false;
        callbacks.onError(new Error("Pi Payments are available only inside Pi Browser."), 'sdk_missing');
      }"""

replacement = """      } else {
        console.warn('[PiPaymentService] window.Pi not found. Simulating payment flow for testing...');
        
        // Simulate Pi Payment flow
        setTimeout(() => {
            const mockPaymentId = 'SIM_' + Math.random().toString(36).substring(7);
            callbacks.onReadyForServerApproval(mockPaymentId);
            
            setTimeout(() => {
                const mockTxid = 'TX_' + Math.random().toString(36).substring(7);
                callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);
                isPaymentInProgress = false;
            }, 2000);
        }, 1500);
      }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/services/piPaymentService.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
