/**
 * Run with: node generate-icons.js
 * Requires: npm install canvas
 *
 * Generates icons/icon16.png, icon48.png, icon128.png
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background rounded rect
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#3a3a40');
  grad.addColorStop(1, '#1a1a1f');
  ctx.fillStyle = grad;
  ctx.fill();

  // Moon icon
  ctx.fillStyle = '#b7b7b7';
  const cx = size / 2;
  const cy = size / 2;
  const moonR = size * 0.28;
  const offsetX = size * 0.08;

  ctx.beginPath();
  ctx.arc(cx, cy, moonR, 0, Math.PI * 2);
  ctx.fill();

  // Cut out to create crescent
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + offsetX, cy - offsetX * 0.5, moonR * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(__dirname, 'icons', `icon${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${outPath}`);
}
