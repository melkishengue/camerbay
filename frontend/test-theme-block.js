const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');
const fs = require('fs');
const path = require('path');

const UNINWIND_CSS = path.join(process.cwd(), 'node_modules/uninwind/uninwind.css');
const cssPath = path.join(process.cwd(), 'global.css');
const css = fs.readFileSync(cssPath, 'utf-8');

const originalContent = fs.readFileSync(UNINWIND_CSS, 'utf-8');

const withoutTheme = [
  '@custom-variant ios (@media ios);',
  '@custom-variant android (@media android);',
  '@custom-variant web (html &);',
  '@custom-variant native (@media native);',
  '',
  '@custom-variant light (&:where(.light, .light *));',
  '@custom-variant dark (&:where(.dark, .dark *));',
  '@custom-variant lavender-light (&:where(.lavender-light, .lavender-light *));',
  '@custom-variant lavender-dark (&:where(.lavender-dark, .lavender-dark *));',
  '@custom-variant mint-light (&:where(.mint-light, .mint-light *));',
  '@custom-variant mint-dark (&:where(.mint-dark, .mint-dark *));',
  '@custom-variant sky-light (&:where(.sky-light, .sky-light *));',
  '@custom-variant sky-dark (&:where(.sky-dark, .sky-dark *));',
  '@custom-variant alpha-light (&:where(.alpha-light, .alpha-light *));',
  '@custom-variant alpha-dark (&:where(.alpha-dark, .alpha-dark *));',
].join('\n');

compile(css, { base: path.dirname(cssPath), onDependency: () => {} }).then(async compiler1 => {
  const tw1 = compiler1.build(new Scanner({ sources: [...compiler1.sources, { negated: false, pattern: '**/*', base: path.dirname(cssPath) }] }).scan());
  const bgCount1 = (tw1.match(/\.bg-background/g) || []).length;
  console.log('WITH @theme:', tw1.length, 'bytes, bg-background:', bgCount1);

  fs.writeFileSync(UNINWIND_CSS, withoutTheme);
  try {
    const compiler2 = await compile(css, { base: path.dirname(cssPath), onDependency: () => {} });
    const tw2 = compiler2.build(new Scanner({ sources: [...compiler2.sources, { negated: false, pattern: '**/*', base: path.dirname(cssPath) }] }).scan());
    const bgCount2 = (tw2.match(/\.bg-background/g) || []).length;
    console.log('WITHOUT @theme:', tw2.length, 'bytes, bg-background:', bgCount2);
  } finally {
    fs.writeFileSync(UNINWIND_CSS, originalContent);
    console.log('Restored.');
  }
}).catch(e => { console.error(e.message); });
