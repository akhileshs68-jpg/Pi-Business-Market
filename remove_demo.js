const fs = require('fs');

let content = fs.readFileSync('src/components/cart/ShoppingCart.tsx', 'utf8');

content = content.replace(/  const handleAddDemoItems = async \(\) => \{[\s\S]*?  \};\n\n/, '');
content = content.replace(/          <button \n            onClick=\{handleAddDemoItems\}[\s\S]*?          <\/button>/, '');

fs.writeFileSync('src/components/cart/ShoppingCart.tsx', content);
