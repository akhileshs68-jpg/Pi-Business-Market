const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const newBusinessType = `export type BusinessType = string; // 'Product Seller' | 'Service Provider' | 'Manufacturer' | 'Freelancer' | 'Professional' | 'Agriculture / Farmer' | 'Local Shop' | 'Company' | 'Startup' | 'NGO' | 'Artist / Creator' | 'Distributor' | 'Wholesaler' | 'Transporter' | 'Educational Institute' | 'Healthcare' | 'Hospitality' | 'Construction' | 'Repair Services' | 'Other';`;

code = code.replace(/export type BusinessType =[\s\S]*?;/, newBusinessType);

fs.writeFileSync('src/types.ts', code);
