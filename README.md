# 🎬 DB Video Editor — 4K Headless Video Generation Engine

> A high-performance, **local-first 4K headless video generation engine** built in Node.js & TypeScript.
> Define storyboards with AI, render frame-by-frame at up to 3840×2160 @ 60 FPS, and encode to MP4 — no browser, no cloud, no external renderer.

---

## ✨ Features

- 🎨 **4K Canvas Pipeline** — `@napi-rs/canvas` (Rust-backed) running at 3840×2160 @ 60 FPS
- 🤖 **AI Agent Bridge** — Native integration for **OpenCode CLI**, **Claude Code**, and **Antigravity CLI**
- 📋 **Storyboard-Driven Rendering** — JSON blueprint → frame-accurate video, zero manual timeline adjustments
- 🔢 **Multi-Resolution Support** — Render at `720p`, `1080p`, `1440p`, or `4K`
- 🎛️ **Quality Presets** — `draft` (ultrafast) → `ultra` (maximum fidelity)
- 💾 **AI Token Optimizer** — SHA-256 prompt caching eliminates redundant LLM computation
- 🎵 **Audio Muxing** — Multi-track audio mixed into final MP4 via FFmpeg

---

## 📋 Prerequisites

- **Node.js 18+** (ESM)
- **FFmpeg** on your system `PATH`

```bash
npm install
```

---

## 🤖 Using with AI Coding Tools (OpenCode CLI / Claude Code / Antigravity CLI)

This engine is purpose-built for AI assistant workflows. Your AI tool acts as the director — it reads markdown briefs, synthesizes storyboards, and renders 4K video completely autonomously.

### Method 1: Programmatic Integration (Recommended for AI Agents)

Your AI tool imports and calls `executeAgentWorkflow()` directly from [`scripts/ai-agent-bridge.ts`](./scripts/ai-agent-bridge.ts):

```typescript
import { executeAgentWorkflow } from './scripts/ai-agent-bridge.ts';

// AI agent passes raw prompt text — no files needed
const result = await executeAgentWorkflow({
  promptText: `
    # Product Launch Promo
    ## Scene 1: Introduction
    Powerful local-first 4K rendering.
    ## Scene 2: The Engine
    Frame-accurate. Canvas-native. TypeScript.
    ## Scene 3: Call to Action
    Rendered in native 4K UHD @ 60 FPS.
  `,
  resolution: '4k',    // 720p | 1080p | 1440p | 4k
  quality: 'high',     // draft | standard | high | ultra
  outputFile: 'out/launch-promo-4k.mp4',
});

console.log(result);
// {
//   success: true,
//   outputVideoPath: "out/launch-promo-4k.mp4",
//   resolution: "3840x2160",
//   quality: "high",
//   scenesCount: 3,
//   totalFrames: 720,
//   elapsedSeconds: 345.7
// }
```

### Method 2: JSON Request Payload (For OpenCode/Antigravity CLI file-based workflows)

1. AI tool creates `content/agent-request.json`:

```json
{
  "promptPath": "content/promo-idea-1.md",
  "resolution": "1080p",
  "quality": "standard",
  "outputFile": "out/my-video.mp4"
}
```

2. AI tool or human triggers:

```bash
npm run agent content/agent-request.json
```

### Method 3: Markdown Brief → Full Render (One-liner)

Drop a markdown brief and let the agent bridge handle everything end-to-end:

```bash
npm run agent content/promo-idea-1.md
```

### 📌 OpenCode CLI Example Session

```bash
# Inside an OpenCode CLI session pointed at this project:

> "Create a 4K product promo video for my SaaS launch"

# OpenCode will:
# 1. Write a markdown brief to content/agent-prompt.md
# 2. Call executeAgentWorkflow() in scripts/ai-agent-bridge.ts
# 3. Synthesize content/storyboard.json (with SHA-256 token cache check)
# 4. Render out/agent-render-4k.mp4 at 3840x2160 @ 60fps
# 5. Return a JSON response with video path and render stats
```

### 📌 Antigravity CLI Example

```bash
# Run Antigravity CLI in this project directory, then ask:
> "Generate a 1080p high-quality storyboard video from content/promo-idea-1.md"

# Antigravity will use scripts/ai-agent-bridge.ts and render at 1080p/high quality
```

---

## 💻 Manual CLI Usage

### Initialize Workspace

```bash
npm run init                          # scaffold dirs & generate TUTORIAL.md
npm run init -- --name "My Project"  # with custom project name
```

### AI Storyboard Planning

```bash
npm run plan                                            # uses content/promo-idea-1.md
npm run cli -- plan --input content/brief.md            # custom input
```

### Render

```bash
# Storyboard-driven rendering with resolution + quality control:
npm run cli -- render --storyboard content/storyboard.json --resolution 4k --quality high
npm run cli -- render --storyboard content/storyboard.json --resolution 720p --quality draft
npm run cli -- render --storyboard content/storyboard.json --resolution 1080p --quality ultra

# Composition shortcuts:
npm run render:bouncing-ball
npm run render:gradient-spin
npm run render:tech-promo
```

### AI Token Usage Report

```bash
npm run tokens
```

Output:
```
=== AI Token Usage & Optimization Report ===
Total Planning Runs : 2
Total Tokens Used   : 638
Total Tokens Saved  : 638 (via prompt caching)
```

### Validate Assets

```bash
npm run validate
```

---

## 🎛️ Resolution & Quality Reference

| `--resolution` | Dimensions | Use Case |
|:---|:---|:---|
| `720p` | 1280 × 720 | Fast draft previews |
| `1080p` | 1920 × 1080 | Full HD web / social |
| `1440p` | 2560 × 1440 | Quad HD displays |
| `4k` | 3840 × 2160 | Production default |

| `--quality` | CRF | Speed | Use Case |
|:---|:---|:---|:---|
| `draft` | 28 | 🚀 Ultrafast | Layout checks |
| `standard` | 23 | ⚡ Fast | Balanced |
| `high` | 18 | 🎬 Medium | Production |
| `ultra` | 14 | 💎 Slow | Max fidelity |

---

## 📁 Project Structure

```
├── assets/
│   ├── images/          # Backgrounds, logos, overlays
│   ├── audio/           # Music, voiceovers, SFX
│   └── fonts/           # Custom TTF/OTF typography
├── compositions/        # Pure TS canvas rendering functions
├── content/
│   ├── storyboard.json  # AI-synthesized video blueprint
│   ├── storyboard-schema.json  # JSON schema definition
│   └── token-usage-log.json    # AI token audit trail
├── core/
│   ├── engine.ts        # 4K canvas + FFmpeg render pipeline
│   ├── easing.ts        # Spring physics, interpolation math
│   ├── tokens.ts        # AI token tracker & SHA-256 cache
│   ├── types.ts         # Resolution & quality presets
│   └── validate.ts      # Asset manifest scanner
├── scripts/
│   ├── ai-agent-bridge.ts   # 🤖 OpenCode / Claude Code / Antigravity integration
│   ├── storyboard-planner.ts # AI storyboard synthesizer
│   └── ai-director.ts       # Markdown-to-composition director
├── out/                 # Rendered MP4 outputs (git-ignored)
├── cli.ts               # Terminal CLI entrypoint
├── USER_GUIDE.md        # Full user & creator manual
├── TUTORIAL.md          # Quick start tutorial
└── IMPLEMENTATION.md    # Architecture & technical reference
```

---

## 📚 Documentation

| File | Purpose |
|:---|:---|
| [`USER_GUIDE.md`](./USER_GUIDE.md) | End-to-end creator workflow guide |
| [`TUTORIAL.md`](./TUTORIAL.md) | Quick start & CLI syntax reference |
| [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | Architecture & technical deep-dive |

---

## License

Private project. See `package.json` for versioning.