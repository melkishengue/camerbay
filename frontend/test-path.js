const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
console.log('cwd:', cwd);
console.log('cwd hex:', Buffer.from(cwd).toString('hex'));

// Check relative vs absolute
const relPath = './node_modules/uninwind/uninwind.css';
const absPath = path.join(cwd, 'node_modules/uninwind/uninwind.css');

console.log('\nRelative path:', relPath);
console.log('Rel exists:', fs.existsSync(relPath));

console.log('\nAbsolute path:', absPath);
console.log('Abs exists:', fs.existsSync(absPath));

// Check if path.join changes anything
const realCwd = fs.realpathSync('.');
console.log('\nrealCwd:', realCwd);
console.log('realCwd hex (last 20):', Buffer.from(realCwd.slice(-20)).toString('hex'));

const realAbsPath = path.join(realCwd, 'node_modules/uninwind/uninwind.css');
console.log('\nRealAbs path:', realAbsPath);
console.log('RealAbs exists:', fs.existsSync(realAbsPath));
