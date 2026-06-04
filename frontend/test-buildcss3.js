const fs = require('fs');
const path = require('path');

// Get the actual package name from filesystem
const items = fs.readdirSync('./node_modules');
const pkgName = items.find(x => x.startsWith('uni') && x.endsWith('d') && x.length === 7);
console.log('Package name:', JSON.stringify(pkgName), 'hex:', Buffer.from(pkgName).toString('hex'));

const pkgDir = `./node_modules/${pkgName}`;
const uninwindCSSPath = `${pkgDir}/uninwind.css`;
const sharedDir = `${pkgDir}/dist/shared`;

// Find the C50t4R5h file
const sharedFiles = fs.readdirSync(sharedDir);
const c50File = sharedFiles.find(f => f.includes('C50t'));
console.log('C50t file:', c50File);

const { buildCSS } = require(`${pkgDir}/dist/shared/${c50File}`);

const original = fs.readFileSync(uninwindCSSPath, 'utf-8');
console.log('\nOriginal uninwind.css:');
console.log('  length:', original.length, 'has @theme:', original.includes('@theme'));

const themes = ['light','dark','lavender-light','lavender-dark','mint-light','mint-dark','sky-light','sky-dark','alpha-light','alpha-dark'];

buildCSS(themes, path.resolve('./global.css')).then(() => {
  const modified = fs.readFileSync(uninwindCSSPath, 'utf-8');
  console.log('\nAfter buildCSS:');
  console.log('  length:', modified.length, 'has @theme:', modified.includes('@theme'));
  console.log('  Preview:\n' + modified.substring(0, 500));
  
  // Restore
  fs.writeFileSync(uninwindCSSPath, original);
  console.log('\nRestored original.');
}).catch(e => {
  console.error('Error:', e.message);
  fs.writeFileSync(uninwindCSSPath, original);
});
