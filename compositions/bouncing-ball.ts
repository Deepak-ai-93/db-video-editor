import type { Composition } from '../core/engine.ts';

export const bouncingBall: Composition = {
  id: 'bouncing-ball',
  width: 1280,
  height: 720,
  fps: 30,
  durationInSeconds: 4,

  draw(ctx, { width, height, timeInSeconds, frame, totalFrames }) {
    const floorY = height - 90;
    const radius = 70;
    const travel = height - 240;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const bounce = Math.abs(Math.sin(timeInSeconds * Math.PI * 1.6));
    const y = floorY - radius - travel * bounce;

    for (let i = 5; i >= 1; i--) {
      const t = Math.max(0, timeInSeconds - i * 0.06);
      const py = floorY - radius - travel * Math.abs(Math.sin(t * Math.PI * 1.6));
      ctx.globalAlpha = 0.5 / i;
      ctx.beginPath();
      ctx.arc(width / 2, py, radius * (1 - i * 0.05), 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const glow = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, radius * 2);
    glow.addColorStop(0, 'rgba(244, 114, 182, 0.9)');
    glow.addColorStop(0.6, 'rgba(244, 114, 182, 0.35)');
    glow.addColorStop(1, 'rgba(244, 114, 182, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(width / 2, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(width / 2, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
    ctx.beginPath();
    ctx.ellipse(width / 2, floorY + 8, 90, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`frame ${frame + 1} / ${totalFrames}`, width / 2, 40);
    ctx.fillText(`${timeInSeconds.toFixed(2)}s`, width / 2, 70);
  },
};