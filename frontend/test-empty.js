const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');
const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), './global.css');
const css = fs.readFileSync(cssPath, 'utf-8');

compile(css, { base: path.dirname(cssPath), onDependency: () => {} }).then(compiler => {
  // Simulate 0 candidates
  const tailwindCSS0 = compiler.build([]);
  console.log('With 0 candidates, tailwindCSS length:', tailwindCSS0.length);
  console.log('Sample (0 cands):', tailwindCSS0.substring(0, 200));
  
  // With real candidates
  const { Scanner } = require('@tailwindcss/oxide');
  const scanner = new Scanner({
    sources: [...compiler.sources, { negated: false, pattern: '**/*', base: path.dirname(cssPath) }]
  });
  const candidates = scanner.scan();
  const tailwindCSSFull = compiler.build(candidates);
  console.log('\nWith', candidates.length, 'candidates, tailwindCSS length:', tailwindCSSFull.length);
  
  // Now check how many utility classes are in each
  const utilityMatches0 = (tailwindCSS0.match(/@layer utilities/g) || []).length;
  const utilityMatchesFull = (tailwindCSSFull.match(/@layer utilities/g) || []).length;
  console.log('\nutility @layer in 0-cands:', utilityMatches0);
  console.log('utility @layer in full:', utilityMatchesFull);
}).catch(e => console.error(e.message));
