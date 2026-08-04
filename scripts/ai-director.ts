import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const COMPOSITION_FILE = path.join(ROOT, 'compositions', 'tech-promo.ts');
const CLI_FILE = path.join(ROOT, 'cli.ts');
const DEFAULT_IDEA = path.join(ROOT, 'content', 'promo-idea-1.md');

interface Palette {
  accent: string;
  accentMuted: string;
}

const PALETTES: Record<string, Palette> = {
  cyan: { accent: '#22d3ee', accentMuted: '#67e8f9' },
  teal: { accent: '#2dd4bf', accentMuted: '#5eead4' },
  blue: { accent: '#3b82f6', accentMuted: '#60a5fa' },
  indigo: { accent: '#6366f1', accentMuted: '#818cf8' },
  violet: { accent: '#a78bfa', accentMuted: '#c4b5fd' },
  purple: { accent: '#c084fc', accentMuted: '#d8b4fe' },
  pink: { accent: '#f472b6', accentMuted: '#f9a8d4' },
  rose: { accent: '#fb7185', accentMuted: '#fda4af' },
  red: { accent: '#f87171', accentMuted: '#fca5a5' },
  orange: { accent: '#fb923c', accentMuted: '#fdba74' },
  amber: { accent: '#fbbf24', accentMuted: '#fcd34d' },
  gold: { accent: '#f5c518', accentMuted: '#f7dd6b' },
  lime: { accent: '#a3e635', accentMuted: '#bef264' },
  green: { accent: '#34d399', accentMuted: '#6ee7b7' },
  emerald: { accent: '#10b981', accentMuted: '#34d399' },
  sky: { accent: '#38bdf8', accentMuted: '#7dd3fc' },
};

const PALETTE_KEYS = Object.keys(PALETTES);

function cleanInput(value: string, maxLength: number): string {
  return value
    .replace(/\r/g, '')
    .replace(/["'\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseIdea(markdown: string): {
  headline: string;
  tagline: string;
  paletteKey: string;
  palette: Palette;
} {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines.find((line) => line.startsWith('# '));
  const headline = cleanInput(
    (title ?? '# YOUR HEADLINE').replace(/^#+\s*/, ''),
    24,
  );

  const taglineLine = lines.find(
    (line) => /^#{1,3}\s+tagline\b/i.test(line) || /^tagline\s*:/i.test(line),
  );
  let tagline = '';
  if (taglineLine) {
    const value = taglineLine
      .replace(/^#{1,3}\s+/i, '')
      .replace(/^tagline\b/i, '')
      .replace(/^:\s*/, '')
      .trim();
    tagline = cleanInput(value, 48);
  }
  if (!tagline) {
    const firstBody = lines.find((line) => line && !line.startsWith('#'));
    tagline = cleanInput(firstBody ?? 'Rendered with the local video engine.', 48);
  }

  const lower = markdown.toLowerCase();
  const paletteKey = PALETTE_KEYS.find((key) => lower.includes(key)) ?? 'cyan';
  return { headline, tagline, paletteKey, palette: PALETTES[paletteKey] };
}

function patchLiteral(source: string, key: string, value: string): string {
  const pattern = new RegExp(`\\b${key}\\s*:\\s*(['"])(.*?)\\1`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find literal "${key}" inside ${COMPOSITION_FILE}`);
  }
  return source.replace(pattern, `${key}: '${value}'`);
}

function main(): void {
  const ideaFile = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_IDEA;
  if (!existsSync(ideaFile)) {
    console.error(`Idea file not found: ${ideaFile}`);
    process.exit(1);
  }

  const markdown = readFileSync(ideaFile, 'utf8');
  const { headline, tagline, paletteKey, palette } = parseIdea(markdown);

  console.log(`[director] reading idea file: ${path.relative(ROOT, ideaFile)}`);
  console.log(`[director] headline         : ${headline}`);
  console.log(`[director] tagline          : ${tagline}`);
  console.log(`[director] theme            : ${paletteKey} (${palette.accent} / ${palette.accentMuted})`);

  let source = readFileSync(COMPOSITION_FILE, 'utf8');
  source = patchLiteral(source, 'headline', headline);
  source = patchLiteral(source, 'tagline', tagline);
  source = patchLiteral(source, 'accent', palette.accent);
  source = patchLiteral(source, 'accentMuted', palette.accentMuted);
  writeFileSync(COMPOSITION_FILE, source);

  console.log(`[director] patched         : ${path.relative(ROOT, COMPOSITION_FILE)}`);
  console.log('[director] triggering CLI render...\n');

  const result = spawnSync(process.execPath, [CLI_FILE, 'render', '--composition=tech-promo'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`[director] failed to spawn render: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 0);
}

main();