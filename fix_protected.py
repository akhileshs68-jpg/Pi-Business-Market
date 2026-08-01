import re

with open('src/auth/ProtectedRoute.tsx', 'r') as f:
    content = f.read()

# I will replace the activeRole validation logic with just return <>{children}</>;
# Specifically, from `const activeRole = (user as any)?.activeRole || null;` up to the end.

old_block = r"  const activeRole = \(user as any\)\?\.activeRole \|\| null;.*?return <>{children}</>;\n};"

content = re.sub(old_block, "  return <>{children}</>;\n};", content, flags=re.DOTALL)

with open('src/auth/ProtectedRoute.tsx', 'w') as f:
    f.write(content)
