import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Add import for paymentEngine
if "import { paymentEngine }" not in content:
    content = content.replace("import { BmpRewardsWallet }", "import { BmpRewardsWallet }\nimport { paymentEngine }")

# Update walletBalance to fetch from paymentEngine
old_use_effect = """
    const loadProfileData = async () => {
      // 1. Load mock wallet
      const storedBalance = localStorage.getItem('pi_wallet_balance');
      if (storedBalance) {
        setWalletBalance(Number(storedBalance));
      } else {
        localStorage.setItem('pi_wallet_balance', '300');
        setWalletBalance(300);
      }
"""
new_use_effect = """
    const loadProfileData = async () => {
      // 1. Load BMP balance
      try {
        if (user) {
          const bal = await paymentEngine.getBalance('bmp_rewards', user.uid);
          setWalletBalance(bal);
        }
      } catch (err) {
        console.error(err);
      }
"""
if old_use_effect.strip() in content:
    pass
# Actually let's just do regex or simple replace
content = content.replace("const storedBalance = localStorage.getItem('pi_wallet_balance');\n      if (storedBalance) {\n        setWalletBalance(Number(storedBalance));\n      } else {\n        localStorage.setItem('pi_wallet_balance', '300');\n        setWalletBalance(300);\n      }", 
"""try {
        if (user) {
          const bal = await paymentEngine.getBalance('bmp_rewards', user.uid);
          setWalletBalance(bal);
        }
      } catch (err) {
        console.error(err);
      }""")

content = content.replace('{walletBalance.toFixed(2)} <span className="text-violet-400">π</span>', '{walletBalance.toFixed(2)} <span className="text-amber-400">BMP</span>')
content = content.replace('Est: ${(walletBalance * 314.159).toLocaleString(undefined, {maximumFractionDigits: 2})} USD', 'BMP Rewards Active')

with open('src/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
