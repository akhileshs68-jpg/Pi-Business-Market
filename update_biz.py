with open('src/pages/BusinessDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("onClick={(b) => navigate(`/business/${b.id}`)}", "onClick={(b) => navigate(`/seller-dashboard/${b.id}`)}")

with open('src/pages/BusinessDashboard.tsx', 'w') as f:
    f.write(content)
