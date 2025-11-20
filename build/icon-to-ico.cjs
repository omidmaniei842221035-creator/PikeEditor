const png2icons = require('png2icons');
const fs = require('fs');

const pngBuffer = fs.readFileSync('build/icon.png');
const output = png2icons.createICO(pngBuffer, png2icons.BEZIER, 0, 0, true);

if (output) {
  fs.writeFileSync('build/icon.ico', output);
  console.log('✅ Created build/icon.ico:', output.length, 'bytes');
} else {
  console.error('❌ Failed to create ICO');
  process.exit(1);
}
