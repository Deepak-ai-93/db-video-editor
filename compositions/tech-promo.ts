import { GlobalFonts, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import path from 'node:path';
import type { Composition, FrameInfo } from '../core/engine.ts';

const ROOT = process.cwd();

GlobalFonts.registerFromPath(
  path.join(ROOT, 'assets', 'fonts', 'SpaceGrotesk-Regular.ttf'),
  'Space Grotesk',
);
GlobalFonts.registerFromPath(
  path.join(ROOT, 'assets', 'fonts', 'SpaceGrotesk-Bold.ttf'),
  'Space Grotesk Bold',
);

export interface TechPromoTheme {
  headline: string;
  tagline: string;
  accent: string;
  accentMuted: string;
  textPrimary: string;
  textMuted: string;
}

export const techPromoTheme: TechPromoTheme = {
  headline: 'Neon Release Reel',
  tagline: 'One brief. Rendered in code.',
  accent: '#a78bfa',
  accentMuted: '#c4b5fd',
  textPrimary: '#ffffff',
  textMuted: '#94a3b8',
};

const background = await loadImage(path.join(ROOT, 'assets', 'tech-bg.png'));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const fadeIn = (t: number, start: number, end: number) =>
  clamp((t - start) / (end - start), 0, 1);

const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export function drawFrame(
  ctx: SKRSContext2D,
  frame: number,
  fps: number,
): void {
  const width = 1920;
  const height = 1080;
  const t = frame / fps;

  const theme = techPromoTheme;
  const { r, g, b } = hexToRgb(theme.accent);

  const zoom = 1 + 0.08 * (t / 5);
  const scale = zoom * Math.max(width / background.width, height / background.height);
  const dw = width * scale;
  const dh = height * scale;
  ctx.drawImage(background, (width - dw) / 2, (height - dh) / 2, dw, dh);

  const vignette = ctx.createLinearGradient(0, 0, 0, height);
  vignette.addColorStop(0, 'rgba(5, 8, 20, 0.55)');
  vignette.addColorStop(0.5, 'rgba(5, 8, 20, 0.1)');
  vignette.addColorStop(1, 'rgba(5, 8, 20, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const titleProgress = easeOutBack(fadeIn(t, 0.25, 0.9));
  const titleScale = 0.75 + 0.25 * titleProgress;
  const titleY = height * 0.36 + (1 - easeOutCubic(fadeIn(t, 0.25, 0.9))) * 40;

  ctx.save();
  ctx.translate(width / 2, titleY);
  ctx.scale(titleScale, titleScale);
  ctx.globalAlpha = titleProgress;
  ctx.fillStyle = theme.textPrimary;
  ctx.font = '700 110px "Space Grotesk Bold"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(theme.headline, 0, 0);
  ctx.restore();

  const barProgress = easeOutCubic(fadeIn(t, 0.9, 1.5));
  const barWidth = 340 * barProgress;
  ctx.globalAlpha = barProgress;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(width / 2 - barWidth / 2, height * 0.485, barWidth, 6);
  ctx.globalAlpha = 1;

  const subProgress = fadeIn(t, 1.1, 1.7);
  const subY = height * 0.545 + (1 - easeOutCubic(subProgress)) * 30;
  ctx.globalAlpha = subProgress;
  ctx.fillStyle = theme.textMuted;
  ctx.font = '400 40px "Space Grotesk"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(theme.tagline, width / 2, subY);
  ctx.globalAlpha = 1;

  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + 0.3 * pulse})`;
  ctx.lineWidth = 2;
  const scanY = height * 0.62 + 260 * Math.sin(t * Math.PI * 0.5);
  ctx.beginPath();
  ctx.moveTo(width * 0.2, scanY);
  ctx.lineTo(width * 0.8, scanY);
  ctx.stroke();

  const dots = 5;
  const active = Math.min(dots - 1, Math.floor(t / (5 / dots)));
  for (let i = 0; i < dots; i++) {
    const isActive = i === active;
    ctx.globalAlpha = isActive ? 1 : 0.3;
    ctx.fillStyle = isActive ? theme.accent : theme.accentMuted;
    ctx.beginPath();
    ctx.arc(width / 2 + (i - (dots - 1) / 2) * 30, height - 90, isActive ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const counterProgress = fadeIn(t, 1.6, 2.0);
  ctx.globalAlpha = counterProgress;
  ctx.fillStyle = theme.textMuted;
  ctx.font = '400 24px "Space Grotesk"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`frame ${frame} @ ${fps}fps`, width / 2, height - 44);
  ctx.globalAlpha = 1;
}

export const techPromo: Composition = {
  id: 'tech-promo',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInSeconds: 5,
  assets: [
    'assets/tech-bg.png',
    'assets/fonts/SpaceGrotesk-Regular.ttf',
    'assets/fonts/SpaceGrotesk-Bold.ttf',
  ],

  draw: (ctx: SKRSContext2D, info: FrameInfo) =>
    drawFrame(ctx, info.frame, info.fps),
};