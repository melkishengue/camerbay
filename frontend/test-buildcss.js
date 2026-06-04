process.chdir('/Users/admin/workspace/private/camerbay-monorepo/frontend');
const { buildCSS } = require('./node_modules/uninwind/dist/shared/uninwind.C50t4R5h.cjs');
const fs = require('fs');

const uninwindCSSPath = './node_modules/uninwind/uninwind.css';
const original = fs.readFileSync(uninwindCSSPath, 'utf-8');
console.log('Original length:', original.length, 'has @theme:', original.includes('@theme'));

const themes = ['light','dark','lavender-light','lavender-dark','mint-light','mint-dark','sky-light','sky-dark','alpha-light','alpha-dark'];

buildCSS(themes, process.cwd() + '/global.css').then(() => {
  const modified = fs.readFileSync(uninwindCSSPath, 'utf-8');
  console.log('After buildCSS length:', modified.length, 'has @theme:', modified.includes('@theme'));
  console.log('First 500 chars:', modified.substring(0, 500));
  fs.writeFileSync(uninwindCSSPath, original);
  console.log('Restored.');
}).catch(e => {
  console.error('buildCSS error:', e.message);
  fs.writeFileSync(uninwindCSSPath, original);
});
