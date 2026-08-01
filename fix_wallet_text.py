import re

with open('src/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

content = content.replace("pi_wallet_", "bmp_wallet_")
content = content.replace("pi_marketplace_wishlist", "bmp_marketplace_wishlist")
content = content.replace("Pi Wallet Address", "BMP Wallet Address")
content = content.replace("Pi Signature", "BMP Signature")
content = content.replace("Pi Business Market", "Pi Business Market")

with open('src/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
