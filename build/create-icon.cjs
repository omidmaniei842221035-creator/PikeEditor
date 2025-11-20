const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 256x256 canvas
const canvas = createCanvas(256, 256);
const ctx = canvas.getContext('2d');

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, 256, 256);
gradient.addColorStop(0, '#3b82f6');
gradient.addColorStop(1, '#1d4ed8');
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(128, 128, 120, 0, Math.PI * 2);
ctx.fill();

// POS Terminal
ctx.fillStyle = '#ffffff';
ctx.globalAlpha = 0.95;
ctx.roundRect(70, 80, 116, 100, 8);
ctx.fill();

// Screen
ctx.globalAlpha = 1;
ctx.fillStyle = '#1e293b';
ctx.roundRect(80, 95, 96, 50, 4);
ctx.fill();

// Screen glow
ctx.fillStyle = '#22c55e';
ctx.globalAlpha = 0.3;
ctx.roundRect(85, 100, 86, 40, 2);
ctx.fill();

// Keypad
ctx.globalAlpha = 1;
ctx.fillStyle = '#64748b';
[90, 108, 126, 144, 162].forEach(x => {
  ctx.beginPath();
  ctx.arc(x, 160, 4, 0, Math.PI * 2);
  ctx.fill();
});

// Card slot
ctx.fillStyle = '#475569';
ctx.roundRect(85, 175, 86, 3, 1.5);
ctx.fill();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('build/icon.png', buffer);
console.log('Icon created: build/icon.png');
