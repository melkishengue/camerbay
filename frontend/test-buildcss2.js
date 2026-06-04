process.chdir('/Users/admin/workspace/private/camerbay-monorepo/frontend');

// Resolve the actual paths via the transformer module
const transformerPath = require.resolve('./node_modules/uninwind/dist/metro/metro-transformer.cjs');
console.log('transformer:', transformerPath);

const sharedDir = transformerPath.replace('/metro/metro-transformer.cjs', '/shared/');
const C50t = sharedDir + 'uninwind.C50t4R5h.cjs';
const fs = require('fs');
console.log('C50t exists:', fs.existsSync(C50t));

const { buildCSS } = require(C50t);
const uninwindCSS = transformerPath.replace('/dist/metro/metro-transformer.cjs', '/uninwind.css');
console.log('uninwind.css:', uninwindCSS);
const original = fs.readFileSync(uninwindCSS, 'utf-8');
console.log('Original length:', original.length, 'has @theme:', original.includes('@theme'));

const themes = ['light','dark','lavender-light','lavender-dark','mint-light','mint-dark','sky-light','sky-dark','alpha-light','alpha-dark'];

buildCSS(themes, process.cwd() + '/global.css').then(() => {
  const modified = fs.readFileSync(uninwindCSS, 'utf-8');
  console.log('After buildCSS length:', modified.length, 'has @theme:', modified.includes('@theme'));
  console.log('Preview:', modified.substring(0, 400));
  fs.writeFileSync(uninwindCSS, original);
  console.log('\nRestored original.');
}).catch(e => {
  console.error('buildCSS error:', e.message);
  try { fs.writeFileSync(uninwindCSS, original); } catch(e2) {}
});
