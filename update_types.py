import re

with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("  unreadCounts: Record<string, number>; // UID -> count", "  unreadCounts: Record<string, number>; // UID -> count\n  archivedBy?: string[];\n  deletedBy?: string[];")

with open('src/types.ts', 'w') as f:
    f.write(content)
