// Check what bytes my literal strings actually have
const literal = 'uninwind';
console.log('literal hex:', Buffer.from(literal).toString('hex'));
console.log('literal length:', literal.length);

// Compare with what filesystem has
const fs = require('fs');
const items = fs.readdirSync('./node_modules');
const pkg = items.find(x => x.startsWith('uni') && x.endsWith('d'));
console.log('fs name hex:', Buffer.from(pkg).toString('hex'));
console.log('fs name length:', pkg.length);
console.log('match:', literal === pkg);
