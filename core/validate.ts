import fs from 'node:fs';
import path from 'node:path';
import type { Composition } from './engine.ts';

export type AssetKind = 'image' | 'audio' | 'font' | 'unknown';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.avif', '.svg']);
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus']);
const FONT_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2']);

export interface AssetCheck {
  path: string;
  kind: AssetKind;
  exists: boolean;
}

export interface DiscoveredAsset {
  relativePath: string;
  absolutePath: string;
  kind: AssetKind;
  sizeBytes: number;
}

export interface AssetManifest {
  images: DiscoveredAsset[];
  audio: DiscoveredAsset[];
  fonts: DiscoveredAsset[];
  unknown: DiscoveredAsset[];
  totalCount: number;
}

export function classifyAsset(assetPath: string): AssetKind {
  const ext = path.extname(assetPath).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  if (FONT_EXTS.has(ext)) return 'font';
  return 'unknown';
}

export function checkCompositionAssets(
  composition: Pick<Composition, 'id' | 'assets'>,
): AssetCheck[] {
  const assetsRoot = path.resolve(process.cwd(), 'assets');
  return (composition.assets ?? []).map((assetPath) => {
    const absolute = path.isAbsolute(assetPath)
      ? assetPath
      : path.join(assetsRoot, assetPath.replace(/^assets[\\/]+/i, ''));
    return {
      path: assetPath,
      kind: classifyAsset(assetPath),
      exists: fs.existsSync(absolute),
    };
  });
}

export function assertCompositionAssets(
  composition: Pick<Composition, 'id' | 'assets'>,
): AssetCheck[] {
  const checks = checkCompositionAssets(composition);
  const missing = checks.filter((check) => !check.exists);
  if (missing.length > 0) {
    const list = missing.map((check) => `  - ${check.kind}: ${check.path}`).join('\n');
    throw new Error(`Composition "${composition.id}" references missing assets:\n${list}`);
  }
  return checks;
}

/**
 * Recursively scans `assets/` subfolders, validates file formats, and generates an AssetManifest object.
 */
export function scanAssetManifest(assetsDir: string = path.resolve(process.cwd(), 'assets')): AssetManifest {
  const manifest: AssetManifest = {
    images: [],
    audio: [],
    fonts: [],
    unknown: [],
    totalCount: 0,
  };

  if (!fs.existsSync(assetsDir)) {
    return manifest;
  }

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
        const kind = classifyAsset(entry.name);
        const stats = fs.statSync(fullPath);
        const assetObj: DiscoveredAsset = {
          relativePath,
          absolutePath: fullPath,
          kind,
          sizeBytes: stats.size,
        };

        if (kind === 'image') manifest.images.push(assetObj);
        else if (kind === 'audio') manifest.audio.push(assetObj);
        else if (kind === 'font') manifest.fonts.push(assetObj);
        else manifest.unknown.push(assetObj);

        manifest.totalCount++;
      }
    }
  }

  walk(assetsDir);
  return manifest;
}
