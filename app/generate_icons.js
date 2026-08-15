const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = '#ff4b4b';
  ctx.font = `bold ${size/4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MR', size/2, size/2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./public/icon-${size}x${size}.png`, buffer);
  console.log(`Generated icon-${size}x${size}.png`);
}

createIcon(192);
createIcon(512);
