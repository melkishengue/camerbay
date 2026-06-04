const fs = require('fs');
const path = require('path');

// Get the actual package name from filesystem
const items = fs.readdirSync('./node_modules');
const pkgName = items.find(x => x.startsWith('uni') && x.endsWith('d') && x.length === 7);
const pkgDir = `./node_modules/${pkgName}`;

// Find the CSS file using filesystem
const pkgContents = fs.readdirSync(pkgDir);
const cssFname = pkgContents.find(f => f.endsWith('.css'));
const uninwindCSSPath = `${pkgDir}/${cssFname}`;
console.log('CSS path:', uninwindCSSPath);

// Find the C50t4R5h shared file
const sharedDir = `${pkgDir}/dist/shared`;
const sharedFiles = fs.readdirSync(sharedDir);
const c50File = sharedFiles.find(f => f.includes('C50t'));
const { buildCSS } = require(path.resolve(`${pkgDir}/dist/shared/${c50File}`));

const original = fs.readFileSync(uninwindCSSPath, 'utf-8');
console.log('Original length:', original.length, 'has @theme:', original.includes('@theme'));

const themes = ['light','dark','lavender-light','lavender-dark','mint-light','mint-dark','sky-light','sky-dark','alpha-light','alpha-dark'];

buildCSS(themes, path.resolve('./global.css')).then(() => {
  const modified = fs.readFileSync(uninwindCSSPath, 'utf-8');
  console.log('\nAfter buildCSS:');
  console.log('  length:', modified.length, 'has @theme:', modified.includes('@theme'));
  if (!modified.includes('@theme')) {
    console.log('  *** @theme REMOVED by buildCSS ***');
    console.log('  Content:', modified.substring(0, 600));
  }
  fs.writeFileSync(uninwindCSSPath, original);
  console.log('\nRestored.');
}).catch(e => {
  console.error('Error:', e.message);
  fs.writeFileSync(uninwindCSSPath, original);
});
