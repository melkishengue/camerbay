const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'node_modules/uninwind/dist/metro/metro-transformer.cjs');
console.log('checking:', p);
console.log('exists:', fs.existsSync(p));

// Also try with require
try {
  const r = require.resolve(p);
  console.log('resolve ok:', r);
} catch(e) {
  console.log('resolve failed:', e.message.substring(0, 100));
}

// Read first 100 bytes
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf-8').substring(0, 100);
  console.log('content:', content);
}
