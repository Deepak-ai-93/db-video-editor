import type { Composition } from '../core/engine.ts';

export const gradientSpin: Composition = {
  id: 'gradient-spin',
  width: 1280,
  height: 720,
  fps: 30,
  durationInSeconds: 4,

  draw(ctx, { width, height, timeInSeconds, frame, totalFrames }) {
    const angle = timeInSeconds * 1.2;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);

    const bg = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
    bg.addColorStop(0, '#7c3aed');
    bg.addColorStop(0.5, '#06b6d4');
    bg.addColorStop(1, '#f97316');
    ctx.fillStyle = bg;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();

    for (let i = 0; i < 3; i++) {
      const orbit = (i / 3) * Math.PI * 2 + timeInSeconds * 1.5;
      const cx = width / 2 + Math.cos(orbit) * (width * 0.3);
      const cy = height / 2 + Math.sin(orbit) * (height * 0.25);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('gradient-spin', width / 2, height / 2);
    ctx.font = '24px sans-serif';
    ctx.fillText(`frame ${frame + 1} / ${totalFrames}`, width / 2, height / 2 + 44);
  },
};