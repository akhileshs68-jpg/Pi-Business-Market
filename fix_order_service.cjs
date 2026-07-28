const fs = require('fs');

let content = fs.readFileSync('src/services/orderService.ts', 'utf8');

// replace the first `};\n\n  // More backward compatibility methods\n  ,` with `,\n  // More backward compatibility methods\n`
content = content.replace(/};\n\s*\/\/\s*More backward compatibility methods\n\s*,/, ",\n  // More backward compatibility methods\n");

// Add closing `};` if missing
if (!content.trim().endsWith('}')) {
  // It actually ends with `}` from the last method, we need `};`
  content += "\n};\n";
} else {
  // if it ends with `}` but not `};`, append `;`
  if (!content.trim().endsWith('};')) {
     content += ";\n";
  }
}

fs.writeFileSync('src/services/orderService.ts', content);
