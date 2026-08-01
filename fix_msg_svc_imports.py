import re

with open('src/services/messagingService.ts', 'r') as f:
    content = f.read()

content = content.replace("increment,\n  runTransaction", "increment,\n  runTransaction,\n  arrayUnion")

with open('src/services/messagingService.ts', 'w') as f:
    f.write(content)
