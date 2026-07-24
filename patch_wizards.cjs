const fs = require('fs');

let bizWiz = fs.readFileSync('src/components/business/BusinessWizard.tsx', 'utf8');
bizWiz = bizWiz.replace(/formData\.logo/g, 'formData.logoUrl');
bizWiz = bizWiz.replace(/formData\.coverImage/g, 'formData.coverImageUrl');
bizWiz = bizWiz.replace(/logo: asset\.downloadUrl/g, 'logoUrl: asset.downloadUrl, logoPublicId: asset.storagePath');
bizWiz = bizWiz.replace(/coverImage: asset\.downloadUrl/g, 'coverImageUrl: asset.downloadUrl, coverPublicId: asset.storagePath');
fs.writeFileSync('src/components/business/BusinessWizard.tsx', bizWiz);

let storeWiz = fs.readFileSync('src/components/store/StoreWizard.tsx', 'utf8');
storeWiz = storeWiz.replace(/formData\.logo/g, 'formData.logoUrl');
storeWiz = storeWiz.replace(/formData\.banner/g, 'formData.coverImageUrl');
storeWiz = storeWiz.replace(/logo: ''/g, 'logoUrl: \'\'');
storeWiz = storeWiz.replace(/banner: ''/g, 'coverImageUrl: \'\'');
storeWiz = storeWiz.replace(/logo: asset\.downloadUrl/g, 'logoUrl: asset.downloadUrl, logoPublicId: asset.storagePath');
storeWiz = storeWiz.replace(/banner: asset\.downloadUrl/g, 'coverImageUrl: asset.downloadUrl, coverPublicId: asset.storagePath');
fs.writeFileSync('src/components/store/StoreWizard.tsx', storeWiz);

let catWiz = fs.readFileSync('src/components/product/CategoryWizard.tsx', 'utf8');
catWiz = catWiz.replace(/initialCategory\?\.banner/g, 'initialCategory?.coverImageUrl');
catWiz = catWiz.replace(/formData\.banner/g, 'formData.coverImageUrl');
catWiz = catWiz.replace(/banner: ''/g, 'coverImageUrl: \'\'');
catWiz = catWiz.replace(/banner: asset\.downloadUrl/g, 'coverImageUrl: asset.downloadUrl');
fs.writeFileSync('src/components/product/CategoryWizard.tsx', catWiz);

let bizCard = fs.readFileSync('src/components/business/BusinessCard.tsx', 'utf8');
bizCard = bizCard.replace(/business\.logo/g, 'business.logoUrl');
fs.writeFileSync('src/components/business/BusinessCard.tsx', bizCard);

