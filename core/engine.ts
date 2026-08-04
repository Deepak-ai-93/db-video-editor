import { createCanvas, loadImage, type SKRSContext2D, type Image } from '@napi-rs/canvas';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  type StoryboardSpec,
  type AudioTrack,
  type QualityPreset,
  QUALITY_PRESETS,
  RESOLUTION_PRESETS,
  type ResolutionPreset,
} from './types.ts';
import { progress, easeInOutCubic, easeOutQuad, lerp } from './easing.ts';

export interface FrameInfo {
  frame: number;
  totalFrames: number;
  width: number;
  height: number;
  fps: number;
  timeInSeconds: number;
}

export type DrawFrame = (ctx: SKRSContext2D, info: FrameInfo) => void;

export interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInSeconds: number;
  assets?: string[];
  draw: DrawFrame;
}

export interface RenderOptions extends Composition {
  outputFile?: string;
  tmpDir?: string;
  keepFrames?: boolean;
  quality?: QualityPreset;
  ffmpegPath?: string;
  onProgress?: (frame: number, totalFrames: number) => void;
}

export interface RenderResult {
  outputFile: string;
  width: number;
  height: number;
  fps: number;
  quality: QualityPreset;
  totalFrames: number;
  elapsedMs: number;
}

export interface RenderStoryboardOptions {
  storyboard: StoryboardSpec;
  resolution?: ResolutionPreset | { width: number; height: number };
  quality?: QualityPreset;
  outputFile?: string;
  onProgress?: (frame: number, totalFrames: number) => void;
}

export function totalFramesOf({ fps, durationInSeconds }: Composition): number {
  return Math.max(1, Math.round(durationInSeconds * fps));
}

export async function render(options: RenderOptions): Promise<RenderResult> {
  const startedAt = Date.now();
  const totalFrames = totalFramesOf(options);
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d');

  const quality: QualityPreset = options.quality ?? 'high';
  const qConfig = QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.high;

  const outputFile = options.outputFile ?? path.join('out', `${options.id}.mp4`);
  const outputDir = path.dirname(path.resolve(outputFile));
  fs.mkdirSync(outputDir, { recursive: true });

  const tmpDir = options.tmpDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'video-engine-'));
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      const info: FrameInfo = {
        frame,
        totalFrames,
        width: options.width,
        height: options.height,
        fps: options.fps,
        timeInSeconds: frame / options.fps,
      };

      options.draw(ctx, info);

      const png = canvas.toBuffer('image/png');
      const frameFile = path.join(tmpDir, `frame-${String(frame).padStart(5, '0')}.png`);
      fs.writeFileSync(frameFile, png);

      options.onProgress?.(frame + 1, totalFrames);
    }

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg();

      if (options.ffmpegPath) {
        command.setFfmpegPath(options.ffmpegPath);
      }

      command
        .input(path.join(tmpDir, 'frame-%05d.png'))
        .inputOptions([`-framerate ${options.fps}`])
        .output(outputFile)
        .outputOptions([
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-crf', String(qConfig.crf),
          '-preset', qConfig.preset,
          '-movflags', '+faststart',
        ])
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    return {
      outputFile,
      width: options.width,
      height: options.height,
      fps: options.fps,
      quality,
      totalFrames,
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    if (!options.keepFrames) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

/**
 * Storyboard-driven multi-resolution rendering engine.
 * Supports rendering at 720p, 1080p, 1440p, or 4K UHD, and quality presets (draft, standard, high, ultra).
 */
export async function renderStoryboard(options: RenderStoryboardOptions): Promise<RenderResult> {
  const startedAt = Date.now();
  const { storyboard } = options;

  let width = storyboard.width ?? 3840;
  let height = storyboard.height ?? 2160;

  if (options.resolution) {
    if (typeof options.resolution === 'string' && options.resolution !== 'custom') {
      const preset = RESOLUTION_PRESETS[options.resolution];
      if (preset) {
        width = preset.width;
        height = preset.height;
      }
    } else if (typeof options.resolution === 'object') {
      width = options.resolution.width;
      height = options.resolution.height;
    }
  }

  const fps = storyboard.fps ?? 60;
  const quality: QualityPreset = options.quality ?? storyboard.quality ?? 'high';
  const qConfig = QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.high;

  // Global scale factor for text and coordinates relative to standard 4K (3840x2160)
  const scaleX = width / 3840;
  const scaleY = height / 2160;

  let currentFrameCount = 0;
  const sceneRanges = storyboard.scenes.map((scene) => {
    const frameDuration = Math.max(1, Math.round(scene.durationInSeconds * fps));
    const startFrame = currentFrameCount;
    const endFrame = startFrame + frameDuration - 1;
    currentFrameCount += frameDuration;
    return {
      scene,
      startFrame,
      endFrame,
      frameDuration,
    };
  });

  const totalFrames = currentFrameCount;

  const outputFile = options.outputFile ?? storyboard.output ?? path.join('out', `storyboard-${width}p.mp4`);
  const outputDir = path.dirname(path.resolve(outputFile));
  fs.mkdirSync(outputDir, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storyboard-engine-'));
  fs.mkdirSync(tmpDir, { recursive: true });

  // Pre-cache media assets (images) into memory
  const imageCache = new Map<string, Image>();
  for (const scene of storyboard.scenes) {
    if (scene.mediaAssets) {
      for (const asset of scene.mediaAssets) {
        const absPath = path.isAbsolute(asset.path) ? asset.path : path.resolve(process.cwd(), asset.path);
        if (fs.existsSync(absPath) && !imageCache.has(absPath)) {
          try {
            const loaded = await loadImage(absPath);
            imageCache.set(absPath, loaded);
          } catch (e) {
            console.warn(`Failed to load image ${absPath}: ${e}`);
          }
        }
      }
    }
  }

  const globalAudioTracks: AudioTrack[] = [];
  for (const range of sceneRanges) {
    const sceneStartTime = range.startFrame / fps;
    if (range.scene.audio) {
      for (const track of range.scene.audio) {
        const absPath = path.isAbsolute(track.path) ? track.path : path.resolve(process.cwd(), track.path);
        if (fs.existsSync(absPath)) {
          globalAudioTracks.push({
            path: absPath,
            startAt: sceneStartTime + (track.startAt ?? 0),
            volume: track.volume ?? 1.0,
          });
        }
      }
    }
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      const activeRange = sceneRanges.find((r) => frame >= r.startFrame && frame <= r.endFrame) ?? sceneRanges[0];
      const { scene, startFrame, frameDuration } = activeRange;

      const localFrame = frame - startFrame;
      const localTime = localFrame / fps;

      // 1. Theme / Background
      const bgColor = scene.theme?.backgroundColor ?? '#000000';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // 2. Media Assets with dynamic scaling
      if (scene.mediaAssets) {
        for (const asset of scene.mediaAssets) {
          const absPath = path.isAbsolute(asset.path) ? asset.path : path.resolve(process.cwd(), asset.path);
          const img = imageCache.get(absPath);
          if (img) {
            ctx.save();
            ctx.globalAlpha = asset.opacity ?? 1.0;
            const drawX = asset.x !== undefined ? asset.x * scaleX : 0;
            const drawY = asset.y !== undefined ? asset.y * scaleY : 0;
            const drawW = asset.width !== undefined ? asset.width * scaleX : width;
            const drawH = asset.height !== undefined ? asset.height * scaleY : height;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
          }
        }
      }

      // 3. Text Overlays with resolution scaling and dynamic animation
      if (scene.textOverlays) {
        for (const textSpec of scene.textOverlays) {
          ctx.save();
          const unscaledSize = textSpec.fontSize ?? 64;
          const fontSize = Math.round(unscaledSize * Math.min(scaleX, scaleY));
          const fontFam = textSpec.fontFamily ?? 'sans-serif';
          ctx.font = `bold ${fontSize}px ${fontFam}`;
          ctx.fillStyle = scene.theme?.textColor ?? '#ffffff';
          ctx.textAlign = (textSpec.align as 'left' | 'center' | 'right' | 'start' | 'end') ?? 'center';

          const baseX = textSpec.x !== undefined ? textSpec.x * scaleX : width / 2;
          const baseY = textSpec.y !== undefined ? textSpec.y * scaleY : height / 2;

          let renderX = baseX;
          let renderY = baseY;
          let alpha = 1.0;
          let textToDraw = textSpec.text;

          if (textSpec.animation === 'fadeIn') {
            const animP = progress(localTime, 0, 1.0);
            alpha = easeOutQuad(animP);
          } else if (textSpec.animation === 'slideUp') {
            const animP = progress(localTime, 0, 1.0);
            const eased = easeInOutCubic(animP);
            renderY = lerp(baseY + 100 * scaleY, baseY, eased);
            alpha = eased;
          } else if (textSpec.animation === 'typewriter') {
            const chars = textSpec.text.length;
            const charP = progress(localTime, 0, 1.5);
            const visibleLength = Math.floor(charP * chars);
            textToDraw = textSpec.text.slice(0, visibleLength);
          }

          ctx.globalAlpha = alpha;
          ctx.fillText(textToDraw, renderX, renderY);
          ctx.restore();
        }
      }

      // 4. Transitions
      if (scene.transition && scene.transition.type !== 'none') {
        const transDurFrames = Math.max(1, Math.round((scene.transition.durationInSeconds ?? 0.5) * fps));
        if (localFrame < transDurFrames) {
          const transP = localFrame / transDurFrames;
          if (scene.transition.type === 'fade') {
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 1 - transP;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
        }
      }

      const png = canvas.toBuffer('image/png');
      const frameFile = path.join(tmpDir, `frame-${String(frame).padStart(6, '0')}.png`);
      fs.writeFileSync(frameFile, png);

      options.onProgress?.(frame + 1, totalFrames);
    }

    // Encoder step with quality parameters
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg();
      command.input(path.join(tmpDir, 'frame-%06d.png')).inputOptions([`-framerate ${fps}`]);

      globalAudioTracks.forEach((track) => {
        command.input(track.path);
      });

      const outputOptions = [
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', String(qConfig.crf),
        '-preset', qConfig.preset,
        '-movflags', '+faststart',
      ];

      if (globalAudioTracks.length > 0) {
        outputOptions.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
      }

      command
        .output(outputFile)
        .outputOptions(outputOptions)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    return {
      outputFile,
      width,
      height,
      fps,
      quality,
      totalFrames,
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}