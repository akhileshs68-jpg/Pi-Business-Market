const fs = require('fs');
let s = fs.readFileSync('src/services/aiEngineService.ts', 'utf8');

s = s.replace(
  "import { searchService, SearchFilters, SearchResult } from './searchService';",
  "import { searchService } from './searchService';\nimport { SearchFilters, SearchIndexEntry } from '../types';"
);

s = s.replace(
  "Promise<SearchResult>",
  "Promise<{ results: SearchIndexEntry[], lastVisible: any }>"
);

fs.writeFileSync('src/services/aiEngineService.ts', s);
