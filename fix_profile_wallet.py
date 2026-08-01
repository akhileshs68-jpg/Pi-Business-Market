import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Replace the whole Wallet Tab block
start_idx = content.find("{/* 3. WALLET TAB */}")
if start_idx != -1:
    end_idx = content.find("{/* 4. WISHLIST TAB */}", start_idx)
    if end_idx != -1:
        new_wallet_tab = """{/* 3. WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <BmpRewardsWallet />
            </div>
          )}
          
          """
        content = content[:start_idx] + new_wallet_tab + content[end_idx:]

with open('src/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)

