const fs = require('fs');
let code = fs.readFileSync('src/components/product/MediaLibrary.tsx', 'utf8');

code = code.replace(
  'const MediaLibrary: React.FC<MediaLibraryProps> = ({',
  'export const MediaLibrary: React.FC<MediaLibraryProps> = ({'
);

code = code.replace(
  '(asset) =>',
  '(asset: MediaAsset) =>'
);

fs.writeFileSync('src/components/product/MediaLibrary.tsx', code);
