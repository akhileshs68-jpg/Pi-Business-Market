import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Replace tab label
content = content.replace("{ id: 'wallet', label: 'Pi Wallet', icon: Wallet },", "{ id: 'wallet', label: 'BMP Rewards', icon: Wallet },")
content = content.replace("Pi Wallet Address", "Wallet Address")

# Replace sandbox wallet logic
wallet_section = r'<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-violet-500/30 transition-colors">.*?</div>'
# Wait, I'll just look at what's in ProfilePage for 'wallet' tab.

