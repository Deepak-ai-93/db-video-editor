# DB Video Editor

A local, code-driven video engine. Define compositions in TypeScript, render them frame-by-frame with canvas, and encode the result to MP4 — all through a single CLI. No browser, no external renderer.

## Features

- **Compositions as code** — each composition is a plain TS module that draws with an HTML5-style canvas API.
- **Programmatic animation** — render to frames with per-frame time-based drawing (`easing`, `spring`, etc.).
- **Simple pipeline** — validate assets → draw frames → pipe into FFmpeg → MP4.
- **AI-director workflow** — drop a markdown brief in `content/` and generate a matching `tech-promo` composition and palette automatically.
- **Zero browser footprint** — runs entirely in Node via `@napi-rs/canvas`.

## Prerequisites

- Node.js 18+ (ESM)
- **FFmpeg** on your `PATH` (used by `fluent-ffmpeg` to encode frames into MP4)

Install dependencies:

```bash
npm install
```

## Usage

### List available compositions

```bash
npm run list
```

### Validate composition assets

Checks that every asset referenced by a composition exists on disk.

```bash
npm run validate               # all compositions
npm run cli -- validate --composition=bouncing-ball   # one composition
```

### Render a composition

```bash
npm run render -- --composition=bouncing-ball          # default out/bouncing-ball.mp4
npm run render -- --composition=gradient-spin --output=out/custom.mp4
```

Per-composition shortcuts:

```bash
npm run render:bouncing-ball
npm run render:gradient-spin
npm run render:tech-promo
```

### AI-director workflow

Generate a composition from a markdown brief:

```bash
npm run direct                 # uses content/promo-idea-1.md
```

## Available compositions

| id             | Resolution | FPS | Duration | Notes                    |
| -------------- | ---------- | --- | -------- | ------------------------ |
| `bouncing-ball`| 1280x720   | 30  | 4s       | Physics-style bounce     |
| `gradient-spin`| 1280x720   | 30  | 8s       | Animated gradient spin   |
| `tech-promo`   | 1280x720   | 30  | 5s       | Text promo, palette from brief |

## Project structure

```
compositions/   individual compositions (declared in index.ts)
core/           engine, easing, types, asset validation
scripts/        ai-director + asset generation helpers
content/        markdown briefs consumed by the director
out/            rendered MP4 output (git-ignored)
cli.ts          command-line entrypoint
```

## Typecheck

```bash
npm run typecheck
```

## License

Private project. See `package.json` for versioning.