const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist-electron');

console.log('Renaming all .js files to .cjs in dist-electron...');

if (!fs.existsSync(distDir)) {
  console.error('dist-electron directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(distDir);

for (const file of files) {
  if (file.endsWith('.js')) {
    const oldPath = path.join(distDir, file);
    const newPath = path.join(distDir, file.replace('.js', '.cjs'));
    fs.renameSync(oldPath, newPath);
    console.log(`  Renamed: ${file} -> ${file.replace('.js', '.cjs')}`);
  }
}

console.log('Done!');
