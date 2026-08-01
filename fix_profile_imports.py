import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { BmpRewardsWallet }\nimport { paymentEngine } from '../components/BmpRewardsWallet';", "import { BmpRewardsWallet } from '../components/BmpRewardsWallet';\nimport { paymentEngine } from '../services/wallet/paymentEngine';")

with open('src/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
