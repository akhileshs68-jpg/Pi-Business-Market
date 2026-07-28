const fs = require('fs');
let code = fs.readFileSync('src/services/searchService.ts', 'utf8');

// The business search is pushing everything. We can apply filters here.
code = code.replace(/if \(b\.businessStatus !== 'archived'\) \{/, `
            let pass = b.businessStatus !== 'archived';
            if (pass && filters.businessType) {
              pass = b.businessType === filters.businessType;
            }
            if (pass && filters.isVerified !== undefined) {
              pass = (b.verificationStatus === 'Verified') === filters.isVerified;
            }
            if (pass && filters.minRating !== undefined) {
              pass = (b.rating || 0) >= filters.minRating;
            }
            if (pass) {
`);

fs.writeFileSync('src/services/searchService.ts', code);
