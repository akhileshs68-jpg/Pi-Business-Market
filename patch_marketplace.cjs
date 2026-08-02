const fs = require('fs');
let content = fs.readFileSync('src/pages/MarketplacePage.tsx', 'utf8');

content = content.replace(
  "import { searchService, SearchEntityType, SearchFilters, SearchIndexEntry } from '../services/searchService';",
  "import { searchService, SearchEntityType, SearchFilters, SearchIndexEntry } from '../services/searchService';\nimport { aiEngineService } from '../services/aiEngineService';"
);

content = content.replace(
  "const { results: data } = await searchService.search(query, filters);",
  "const { results: data } = await aiEngineService.smartSearch(query, filters, user?.uid);"
);

fs.writeFileSync('src/pages/MarketplacePage.tsx', content);
