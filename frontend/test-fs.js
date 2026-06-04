const fs = require('fs');

// Read node_modules and find uninwind
const items = fs.readdirSync('./node_modules');
const found = items.filter(x => x.length <= 8 && x.includes('wind') && !x.includes('tail'));
console.log('wind packages:', found);

for (const f of found) {
  const hex = Buffer.from(f).toString('hex');
  console.log(`  ${JSON.stringify(f)} hex: ${hex}`);
  const subpath = `./node_modules/${f}`;
  console.log(`  exists: ${fs.existsSync(subpath)}`);
  try {
    const sub = fs.readdirSync(subpath);
    console.log('  contents:', sub);
  } catch(e) {
    console.log('  readdir error:', e.message);
  }
}
