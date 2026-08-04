import fs from 'node:fs';
import path from 'node:path';
import type { StoryboardSpec, StoryboardSceneSpec } from '../core/types.ts';
import { scanAssetManifest } from '../core/validate.ts';

const ROOT = process.cwd();

export interface PlanOptions {
  inputFile: string;
  outputFile?: string;
  width?: number;
  height?: number;
  fps?: number;
}

/**
 * Parses natural text/markdown prompt into structured StoryboardSpec object.
 */
export function generateStoryboardFromMarkdown(
  markdown: string,
  options: { width?: number; height?: number; fps?: number } = {},
): StoryboardSpec {
  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const titleLine = lines.find((l) => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#+\s*/, '') : 'AI Generated Storyboard';

  const manifest = scanAssetManifest(path.join(ROOT, 'assets'));

  const bgImage = manifest.images[0]?.relativePath ?? 'assets/tech-bg.png';
  const audioTrack = manifest.audio[0]?.relativePath ?? 'assets/audio/bed.mp3';

  const sceneHeadings = lines.filter((l) => /^#{2,3}\s+/.test(l));

  const scenes: StoryboardSceneSpec[] = [];

  if (sceneHeadings.length > 0) {
    sceneHeadings.forEach((heading, idx) => {
      const sceneTitle = heading.replace(/^#{2,3}\s+/, '');
      scenes.push({
        sceneNumber: idx + 1,
        durationInSeconds: 4,
        theme: {
          backgroundColor: idx % 2 === 0 ? '#090d16' : '#111827',
          accentColor: idx % 2 === 0 ? '#38bdf8' : '#a78bfa',
          textColor: '#ffffff',
        },
        textOverlays: [
          {
            text: sceneTitle,
            fontSize: 72,
            x: 1920,
            y: 1000,
            align: 'center',
            animation: 'fadeIn',
          },
        ],
        mediaAssets: fs.existsSync(path.resolve(ROOT, bgImage))
          ? [{ path: bgImage, opacity: 0.25 }]
          : [],
        audio: fs.existsSync(path.resolve(ROOT, audioTrack))
          ? [{ path: audioTrack, startAt: idx * 4, volume: 0.8 }]
          : [],
      });
    });
  } else {
    // Default 3-scene outline
    scenes.push(
      {
        sceneNumber: 1,
        durationInSeconds: 3,
        transition: { type: 'fade', durationInSeconds: 0.5 },
        theme: { backgroundColor: '#090d16', accentColor: '#38bdf8', textColor: '#ffffff' },
        textOverlays: [
          { text: title, fontSize: 84, x: 1920, y: 960, align: 'center', animation: 'fadeIn' },
          { text: 'Local 4K Headless Engine', fontSize: 42, x: 1920, y: 1120, align: 'center', animation: 'slideUp' },
        ],
        mediaAssets: fs.existsSync(path.resolve(ROOT, bgImage)) ? [{ path: bgImage, opacity: 0.3 }] : [],
      },
      {
        sceneNumber: 2,
        durationInSeconds: 4,
        transition: { type: 'slide', durationInSeconds: 0.5 },
        theme: { backgroundColor: '#111827', accentColor: '#a78bfa', textColor: '#f3f4f6' },
        textOverlays: [
          { text: 'Frame-Accurate Storyboard Pipeline', fontSize: 64, x: 1920, y: 1000, align: 'center', animation: 'typewriter' },
        ],
        audio: fs.existsSync(path.resolve(ROOT, audioTrack)) ? [{ path: audioTrack, startAt: 0, volume: 0.8 }] : [],
      },
      {
        sceneNumber: 3,
        durationInSeconds: 3,
        transition: { type: 'zoom', durationInSeconds: 0.5 },
        theme: { backgroundColor: '#050b14', accentColor: '#34d399', textColor: '#ffffff' },
        textOverlays: [
          { text: 'Rendered in Native 4K UHD @ 60 FPS', fontSize: 72, x: 1920, y: 1080, align: 'center', animation: 'fadeIn' },
        ],
      },
    );
  }

  return {
    title,
    version: '1.0',
    width: options.width ?? 3840,
    height: options.height ?? 2160,
    fps: options.fps ?? 60,
    output: `out/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-4k.mp4`,
    scenes,
  };
}

export function validateStoryboardAssets(storyboard: StoryboardSpec): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const scene of storyboard.scenes) {
    if (scene.mediaAssets) {
      for (const asset of scene.mediaAssets) {
        const absPath = path.isAbsolute(asset.path) ? asset.path : path.resolve(ROOT, asset.path);
        if (!fs.existsSync(absPath)) {
          missing.push(`Scene ${scene.sceneNumber} mediaAsset: ${asset.path}`);
        }
      }
    }
    if (scene.audio) {
      for (const track of scene.audio) {
        const absPath = path.isAbsolute(track.path) ? track.path : path.resolve(ROOT, track.path);
        if (!fs.existsSync(absPath)) {
          missing.push(`Scene ${scene.sceneNumber} audio: ${track.path}`);
        }
      }
    }
  }

  return { valid: missing.length === 0, missing };
}

export function runPlanner(options: PlanOptions): StoryboardSpec {
  const absInput = path.resolve(ROOT, options.inputFile);
  if (!fs.existsSync(absInput)) {
    throw new Error(`Input prompt/file not found: ${absInput}`);
  }

  const content = fs.readFileSync(absInput, 'utf8');
  const storyboard = generateStoryboardFromMarkdown(content, options);

  const validation = validateStoryboardAssets(storyboard);
  if (!validation.valid) {
    console.warn(`[planner warning] The following referenced local assets do not exist yet:\n${validation.missing.map((m) => `  - ${m}`).join('\n')}`);
  } else {
    console.log(`[planner] All referenced local assets validated cleanly.`);
  }

  const outFile = options.outputFile
    ? path.resolve(ROOT, options.outputFile)
    : path.join(ROOT, 'content', 'storyboard.json');

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(storyboard, null, 2), 'utf8');

  console.log(`[planner] Storyboard successfully synthesized: ${path.relative(ROOT, outFile)}`);
  return storyboard;
}

if (process.argv[1] && process.argv[1].endsWith('storyboard-planner.ts')) {
  const input = process.argv[2] ?? 'content/promo-idea-1.md';
  const output = process.argv[3];
  runPlanner({ inputFile: input, outputFile: output });
}
