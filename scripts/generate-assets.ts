import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';

const W = 1920;
const H = 1080;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#0b1026');
bg.addColorStop(0.55, '#131c45');
bg.addColorStop(1, '#050814');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
ctx.lineWidth = 1;
for (let x = 0; x <= W; x += 80) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();
}
for (let y = 0; y <= H; y += 80) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

const orbs = [
  { x: 260, y: 240, r: 420, color: '56, 189, 248' },
  { x: 1620, y: 820, r: 480, color: '168, 85, 247' },
  { x: 1500, y: 220, r: 300, color: '34, 211, 238' },
];
for (const orb of orbs) {
  const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
  glow.addColorStop(0, `rgba(${orb.color}, 0.18)`);
  glow.addColorStop(1, `rgba(${orb.color}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2);
}

const horizon = ctx.createLinearGradient(0, H * 0.55, 0, H);
horizon.addColorStop(0, 'rgba(34, 211, 238, 0)');
horizon.addColorStop(1, 'rgba(34, 211, 238, 0.10)');
ctx.fillStyle = horizon;
ctx.fillRect(0, H * 0.55, W, H * 0.45);

fs.writeFileSync(path.join(process.cwd(), 'assets', 'tech-bg.png'), canvas.toBuffer('image/png'));
console.log('Wrote assets/tech-bg.png');