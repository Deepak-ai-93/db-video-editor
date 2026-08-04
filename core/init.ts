import fs from 'node:fs';
import path from 'node:path';
import { scanAssetManifest, type AssetManifest } from './validate.ts';

export interface InitOptions {
  projectName?: string;
  cwd?: string;
}

export function generateTutorialMarkdown(projectName: string = 'DB Video Editor'): string {
  return `# ${projectName} — User & AI Director Guide

Welcome to **${projectName}**, a high-performance, local-first 4K headless video generation engine powered by Node.js, TypeScript, Canvas, and FFmpeg.

---

## 🚀 Quickstart Instructions

### 1. Installation & Setup
Ensure you have Node.js 18+ and FFmpeg installed on your system PATH.

\`\`\`bash
npm install
\`\`\`

### 2. Basic CLI Command Syntax

- **Initialize Workspace & Generate Scaffolding**:
  \`\`\`bash
  node cli.ts init --name "My 4K Project"
  \`\`\`

- **List Available Compositions**:
  \`\`\`bash
  node cli.ts list
  # or via npm script:
  npm run list
  \`\`\`

- **Validate Composition Assets & Asset Manifest**:
  \`\`\`bash
  node cli.ts validate
  # or for a single composition:
  node cli.ts validate --composition=bouncing-ball
  \`\`\`

- **Render a Composition to 4K / HD Video**:
  \`\`\`bash
  node cli.ts render --composition=tech-promo --output=out/final-4k.mp4
  \`\`\`

---

## 📁 Local Workspace Structure

The engine initializes and expects the following directory structure:

\`\`\`
├── assets/
│   ├── images/     # Logos, backgrounds, visual overlays (.png, .jpg, .svg, .webp)
│   ├── audio/      # Background audio tracks, sound effects, voiceovers (.mp3, .wav)
│   └── fonts/      # Custom local typography (.ttf, .otf, .woff2)
├── content/        # Markdown briefs and AI-generated script JSONs
├── compositions/   # Pure Canvas rendering logic (TypeScript functions)
├── core/           # Rendering pipeline, asset validators, math/easing utilities
├── out/            # Rendered 4K MP4 video outputs
└── cli.ts          # Terminal CLI entrypoint
\`\`\`

### Asset Dropping Guidelines
1. **Images**: Drop high-resolution assets into \`assets/images/\`.
2. **Audio**: Drop background tracks or voiceovers into \`assets/audio/\`.
3. **Fonts**: Drop custom local TTF/OTF fonts into \`assets/fonts/\`.
4. Running \`node cli.ts init\` or \`node cli.ts validate\` will scan these directories and build an **Asset Manifest** automatically.

---

## 🤖 AI Assistant & AI Director Integration

AI tools (such as OpenCode, Claude Code, or Antigravity CLI) can autonomously generate and update video scripts:

1. Place raw markdown briefs or script JSON files inside the \`content/\` directory (e.g. \`content/promo-idea-1.md\`).
2. Run the AI Director script to parse the brief, update composition parameters, and trigger rendering:
   \`\`\`bash
   npm run direct content/promo-idea-1.md
   \`\`\`

---

## 🎬 4K Render Pipeline Architecture

The engine renders frames sequentially or concurrently via Canvas at **3840x2160 (4K UHD) @ 60 FPS**, piping raw buffers straight into FFmpeg with hardware acceleration.

Enjoy rendering high-performance local video with TypeScript!
`;
}

export function initWorkspace(options: InitOptions = {}): {
  createdFolders: string[];
  tutorialPath: string;
  manifest: AssetManifest;
} {
  const rootDir = options.cwd ?? process.cwd();
  const projectName = options.projectName ?? 'DB Video Editor';

  const foldersToCreate = [
    'assets/images',
    'assets/audio',
    'assets/fonts',
    'content',
    'compositions',
    'out',
  ];

  const createdFolders: string[] = [];
  for (const folder of foldersToCreate) {
    const fullPath = path.join(rootDir, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      createdFolders.push(folder);
    }
  }

  // Write TUTORIAL.md
  const tutorialPath = path.join(rootDir, 'TUTORIAL.md');
  const tutorialContent = generateTutorialMarkdown(projectName);
  fs.writeFileSync(tutorialPath, tutorialContent, 'utf8');

  // Scan asset manifest
  const manifest = scanAssetManifest(path.join(rootDir, 'assets'));

  return {
    createdFolders,
    tutorialPath,
    manifest,
  };
}
