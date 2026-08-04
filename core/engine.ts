import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
  ffmpegPath?: string;
  onProgress?: (frame: number, totalFrames: number) => void;
}

export interface RenderResult {
  outputFile: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  elapsedMs: number;
}

export function totalFramesOf({ fps, durationInSeconds }: Composition): number {
  return Math.max(1, Math.round(durationInSeconds * fps));
}

export async function render(options: RenderOptions): Promise<RenderResult> {
  const startedAt = Date.now();
  const totalFrames = totalFramesOf(options);
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d');

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
          '-crf', '18',
          '-preset', 'medium',
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
      totalFrames,
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    if (!options.keepFrames) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}