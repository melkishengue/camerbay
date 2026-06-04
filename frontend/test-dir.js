const fs = require('fs');

// Read the actual uninwind directory contents
const items = fs.readdirSync('./node_modules/uninwind');
console.log('Contents of uninwind/:');
for (const item of items) {
  const hex = Buffer.from(item).toString('hex');
  const existsDir = fs.existsSync(`./node_modules/uninwind/${item}`);
  console.log(`  ${JSON.stringify(item)} hex:${hex} exists:${existsDir}`);
}
