import png2icons from 'png2icons';
import fs from 'fs';

// Read existing PNG icon
const pngBuffer = fs.readFileSync('build/icon.png');

// Convert to .ico with multiple sizes (16, 24, 32, 48, 64, 128, 256)
try {
  const output = png2icons.createICO(pngBuffer, png2icons.BEZIER, 0, 0, true);
  
  if (output) {
    fs.writeFileSync('build/icon.ico', output);
    console.log('✅ Created build/icon.ico successfully from icon.png!');
    console.log('   Size:', output.length, 'bytes');
  } else {
    console.error('❌ png2icons returned null');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error creating .ico:', err.message);
  process.exit(1);
}
