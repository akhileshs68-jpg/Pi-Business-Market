const fs = require('fs');

let catWiz = fs.readFileSync('src/components/product/CategoryWizard.tsx', 'utf8');
catWiz = catWiz.replace(/banner: ''/g, "coverImageUrl: ''");
catWiz = catWiz.replace(/banner: initialCategory\?\.banner \|\| ''/g, "coverImageUrl: initialCategory?.coverImageUrl || ''");
catWiz = catWiz.replace(/banner: initialCategory\?\.coverImageUrl/g, "coverImageUrl: initialCategory?.coverImageUrl");
fs.writeFileSync('src/components/product/CategoryWizard.tsx', catWiz);

let storeWiz = fs.readFileSync('src/components/store/StoreWizard.tsx', 'utf8');
// Add public ID to the state type
storeWiz = storeWiz.replace(
  /logoUrl: '',\n    coverImageUrl: ''/,
  "logoUrl: '',\n    logoPublicId: '',\n    coverImageUrl: '',\n    coverPublicId: ''"
);
fs.writeFileSync('src/components/store/StoreWizard.tsx', storeWiz);

let bizWiz = fs.readFileSync('src/components/business/BusinessWizard.tsx', 'utf8');
bizWiz = bizWiz.replace(
  /logoUrl: '',\n    coverImageUrl: '',/,
  "logoUrl: '',\n    logoPublicId: '',\n    coverImageUrl: '',\n    coverPublicId: '',"
);
fs.writeFileSync('src/components/business/BusinessWizard.tsx', bizWiz);

