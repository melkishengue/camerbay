const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');
const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), './global.css');
const css = fs.readFileSync(cssPath, 'utf-8');

compile(css, { base: path.dirname(cssPath), onDependency: () => {} }).then(compiler => {
  const scanner = new Scanner({
    sources: [...compiler.sources, { negated: false, pattern: '**/*', base: path.dirname(cssPath) }]
  });
  const tailwindCSS = compiler.build(scanner.scan());
  console.log('tailwindCSS length:', tailwindCSS.length);

  // Extract serialize and serializeJSObject from the transformer source
  const src = fs.readFileSync('./node_modules/uniwind/dist/metro/metro-transformer.cjs', 'utf-8');
  
  // Load shared modules
  const common = require('./node_modules/uniwind/dist/shared/uniwind.DHHHCF6a.cjs');
  const stringifyThemes = require('./node_modules/uniwind/dist/shared/uniwind.C50t4R5h.cjs');
  const lightningcss = require('lightningcss');
  const culori = require('culori');
  
  // Build the transformer module context
  const types = require('./node_modules/uniwind/dist/shared/uniwind.BZIuaszw.cjs');
  
  // Define globals needed
  const moduleCode = `
(function(exports, require, fs, path, common, types, stringifyThemes, lightningcss, culori) {
${src.replace("'use strict';", "").replace(/^const fs = require\('fs'\);$/m, '').replace(/^const path = require\('path'\);$/m, '').replace(/^const common = require\([^)]+\);$/m, '').replace(/^const node = require\([^)]+\);$/m, '').replace(/^const oxide = require\([^)]+\);$/m, '').replace(/^const types = require\([^)]+\);$/m, '').replace(/^const stringifyThemes = require\([^)]+\);$/m, '').replace(/^const lightningcss = require\([^)]+\);$/m, '').replace(/^const culori = require\([^)]+\);$/m, '')}
return exports;
})(module.exports, require, fs, path, common, types, stringifyThemes, lightningcss, culori);
`;

  // This approach is too complex. Let's just test the serializeJSObject pattern directly.
  
  // Simple test: can new Function validate a complex getter object?
  const testCases = [
    // Simple case
    `"backgroundColor": "red",`,
    // With CSS var reference
    `"backgroundColor": \`\${rt['--background']}\`,`,
    // With backtick
    `"color": \`\${rt['--foreground']}\`,`,
  ];
  
  for (const tc of testCases) {
    try {
      new Function(`function validateJS() { const obj = ({ ${tc} }) }`);
      console.log('PASS:', tc.substring(0, 50));
    } catch(e) {
      console.log('FAIL:', e.message, '|', tc.substring(0, 50));
    }
  }

}).catch(e => console.error(e.message));
