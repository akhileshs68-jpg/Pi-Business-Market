const fs = require('fs');
let code = fs.readFileSync('src/pages/BusinessProfile.tsx', 'utf8');

code = code.replace(/alert\('Menu clicked'\)/g, "setShowActionMenu(!showActionMenu)");
code = code.replace(/alert\('Document upload modal coming soon'\)/g, "setIsDocumentModalOpen(true)");

// Add the state variable
if (!code.includes('const [isDocumentModalOpen, setIsDocumentModalOpen]')) {
  code = code.replace(
    "const [isEditModalOpen, setIsEditModalOpen] = useState(false);",
    "const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);"
  );
}

// Add DocumentManager modal
if (!code.includes('<DocumentManager')) {
  // We need to import DocumentManager
  code = code.replace(
    "import { mediaService } from '../services/mediaService';",
    "import { mediaService } from '../services/mediaService';\nimport DocumentManager from '../components/business/DocumentManager';"
  );
  
  // Add it before the closing AnimatePresence of the Edit Modal or at the end of the return statement
  code = code.replace(
    "      </AnimatePresence>\n    </div>\n  );\n};\n\nexport default BusinessProfile;",
    "      </AnimatePresence>\n\n      <AnimatePresence>\n        {isDocumentModalOpen && business && (\n          <DocumentManager \n            businessId={business.id} \n            ownerUid={user?.uid || ''} \n            onClose={() => setIsDocumentModalOpen(false)} \n          />\n        )}\n      </AnimatePresence>\n    </div>\n  );\n};\n\nexport default BusinessProfile;"
  );
}

fs.writeFileSync('src/pages/BusinessProfile.tsx', code);
