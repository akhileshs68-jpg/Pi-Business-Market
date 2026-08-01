import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Make sure to import BmpRewardsWallet
if "import { BmpRewardsWallet }" not in content:
    content = content.replace("import { CreditCard, History, Settings", "import { BmpRewardsWallet }\nfrom '../components/BmpRewardsWallet';\nimport { CreditCard, History, Settings")

# Replace wallet tab logic
pattern = r'\{\/\* 3\. WALLET TAB \*\/\}.*?activeTab === \'wallet\' && \([\s\S]*?\}\s*\)\}'

new_tab = """{/* 3. WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <BmpRewardsWallet />
            </div>
          )}"""

content = re.sub(pattern, new_tab, content)

with open('src/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
