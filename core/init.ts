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

- **Synthesize Storyboard JSON via AI Planner**:
  \`\`\`bash
  node cli.ts plan --input content/promo-idea-1.md --output content/storyboard.json
  # or via npm script:
  npm run plan
  \`\`\`

- **Render a Storyboard or Composition to 4K Video**:
  \`\`\`bash
  # Render Storyboard JSON directly:
  node cli.ts render --storyboard content/storyboard.json --output out/final-storyboard-4k.mp4

  # Or render legacy programmatic compositions:
  node cli.ts render --composition tech-promo --output out/final-4k.mp4
  \`\`\`

- **List & Validate Assets**:
  \`\`\`bash
  node cli.ts list
  node cli.ts validate
  \`\`\`

---

## 📁 Local Workspace Structure

The engine initializes and expects the following directory structure:

\`\`\`
├── assets/
│   ├── images/     # Logos, backgrounds, visual overlays (.png, .jpg, .svg, .webp)
│   ├── audio/      # Background audio tracks, sound effects, voiceovers (.mp3, .wav)
│   └── fonts/      # Custom local typography (.ttf, .otf, .woff2)
├── content/
│   ├── storyboard-schema.json  # Master JSON schema definition
│   ├── storyboard.json         # Synthesized video blueprint
│   └── promo-idea-1.md         # Raw markdown prompt/brief
├── compositions/   # Pure Canvas rendering logic (TypeScript functions)
├── core/           # Rendering pipeline, asset validators, math/easing utilities
├── scripts/        # AI director and Storyboard planner bridge scripts
├── out/            # Rendered 4K MP4 video outputs
└── cli.ts          # Terminal CLI entrypoint
\`\`\`

---

## 🎨 AI Storyboard Planning Workflow

AI tools (such as OpenCode, Claude Code, or Antigravity CLI) follow a 3-step video creation flow:

1. **Drafting Briefs**: Drop raw markdown ideas/prompts into \`content/\`.
2. **AI Storyboard Generation**: Run \`npm run plan -- --input content/promo-idea-1.md\`. The AI planner generates a frame-accurate, schema-compliant JSON file (\`content/storyboard.json\`) complete with scene numbers, transitions, audio timelines, theme colors, and layout coordinates.
3. **Editing & Previewing**: Edit or inspect \`content/storyboard.json\` prior to compilation.
4. **4K Render Compilation**: Execute \`npm run render:storyboard\`. The engine reads the JSON, pre-caches assets, dynamically interpolates scene text overlays and transitions, and outputs an ultra-crisp 3840x2160 @ 60 FPS MP4 video.

---

## 🎬 4K Render Pipeline Architecture

The engine renders frames sequentially via Canvas at **3840x2160 (4K UHD) @ 60 FPS**, piping raw buffers straight into FFmpeg with hardware acceleration.

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
