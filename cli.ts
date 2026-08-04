import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { render, renderStoryboard, type Composition } from './core/engine.ts';
import { compositions } from './compositions/index.ts';
import { assertCompositionAssets, checkCompositionAssets, scanAssetManifest } from './core/validate.ts';
import { initWorkspace } from './core/init.ts';
import { runPlanner } from './scripts/storyboard-planner.ts';
import { loadTokenLog } from './core/tokens.ts';
import type { StoryboardSpec, QualityPreset, ResolutionPreset } from './core/types.ts';

const program = new Command();

function findComposition(name: string): Composition {
  const found = compositions.find((c) => c.id === name);
  if (!found) {
    throw new Error(
      `Unknown composition "${name}". Available: ${compositions.map((c) => c.id).join(', ')}`,
    );
  }
  return found;
}

function reportProgress(frame: number, total: number): void {
  const pct = Math.floor((frame / total) * 100);
  process.stdout.write(`\rRendering frames ${frame}/${total} (${pct}%)`);
  if (frame === total) {
    process.stdout.write('\n');
  }
}

program.name('video-engine').description('Custom local video engine CLI').version('0.4.0');

program
  .command('init')
  .description('Scaffold local directory structure, generate TUTORIAL.md, and output asset manifest')
  .option('--name <project-name>', 'project title for documentation', 'DB Video Editor')
  .action((options: { name: string }) => {
    console.log(`\nInitializing workspace for "${options.name}"...`);
    const result = initWorkspace({ projectName: options.name });

    console.log('\n[1/3] Workspace Directory Scaffolding:');
    const allDirectories = [
      'assets/images/',
      'assets/audio/',
      'assets/fonts/',
      'content/',
      'compositions/',
      'out/',
    ];
    for (const dir of allDirectories) {
      console.log(`  - [ok] ${dir}`);
    }

    console.log(`\n[2/3] Documentation Engine:`);
    console.log(`  - [ok] TUTORIAL.md generated`);

    console.log(`\n[3/3] Local Asset Manifest Scan:`);
    const { manifest } = result;
    console.log(`  - Images (${manifest.images.length}): ${manifest.images.map((i) => i.relativePath).join(', ') || 'none'}`);
    console.log(`  - Audio  (${manifest.audio.length}): ${manifest.audio.map((a) => a.relativePath).join(', ') || 'none'}`);
    console.log(`  - Fonts  (${manifest.fonts.length}): ${manifest.fonts.map((f) => f.relativePath).join(', ') || 'none'}`);
    console.log(`  - Total scanned: ${manifest.totalCount} asset(s)`);

    console.log('\nWorkspace initialization complete!');
  });

program
  .command('plan')
  .description('Synthesize structured storyboard JSON from markdown prompt/brief')
  .option('--input <file>', 'path to input markdown brief', 'content/promo-idea-1.md')
  .option('--output <file>', 'path to output storyboard JSON', 'content/storyboard.json')
  .action((options: { input: string; output: string }) => {
    console.log(`\nSynthesizing AI Storyboard...`);
    const storyboard = runPlanner({ inputFile: options.input, outputFile: options.output });
    console.log(`Created Storyboard "${storyboard.title}" with ${storyboard.scenes.length} scenes.`);
  });

program
  .command('tokens')
  .description('Display AI Token Usage and Optimization Report')
  .action(() => {
    const log = loadTokenLog();
    console.log('\n=== AI Token Usage & Optimization Report ===');
    console.log(`Total Planning Runs : ${log.totalRuns}`);
    console.log(`Total Prompt Tokens : ${log.totalPromptTokens}`);
    console.log(`Total Compl. Tokens : ${log.totalCompletionTokens}`);
    console.log(`Total Tokens Used   : ${log.totalTokensUsed}`);
    console.log(`Total Tokens Saved  : ${log.totalTokensSaved} (via prompt caching)`);
    if (log.records.length > 0) {
      console.log('\nRecent Runs:');
      log.records.slice(-5).forEach((r, idx) => {
        console.log(`  ${idx + 1}. [${r.timestamp.split('T')[0]}] ${r.promptFile} -> ${r.cached ? 'CACHED (saved ' + r.tokensSaved + ' tokens)' : r.totalTokens + ' tokens'}`);
      });
    }
  });

program
  .command('render')
  .description('Validate assets and render a composition or storyboard to MP4 with resolution and quality controls')
  .option('--composition <name>', 'composition id to render')
  .option('--storyboard <file>', 'storyboard JSON file to render (e.g. content/storyboard.json)')
  .option('--resolution <preset>', 'target resolution (720p, 1080p, 1440p, 4k)', '4k')
  .option('--quality <preset>', 'video encoding quality (draft, standard, high, ultra)', 'high')
  .option('--output <file>', 'output mp4 path')
  .action(async (options: {
    composition?: string;
    storyboard?: string;
    resolution?: string;
    quality?: string;
    output?: string;
  }) => {
    const resPreset = (options.resolution as ResolutionPreset) ?? '4k';
    const qualPreset = (options.quality as QualityPreset) ?? 'high';

    if (options.storyboard) {
      const sbPath = path.resolve(process.cwd(), options.storyboard);
      if (!fs.existsSync(sbPath)) {
        throw new Error(`Storyboard file not found: ${sbPath}`);
      }
      const storyboard: StoryboardSpec = JSON.parse(fs.readFileSync(sbPath, 'utf8'));
      const outputFile = options.output ?? `out/storyboard-${resPreset}-${qualPreset}.mp4`;

      console.log(`Rendering Storyboard: "${storyboard.title}" [Resolution: ${resPreset}, Quality: ${qualPreset}]...`);
      const result = await renderStoryboard({
        storyboard,
        resolution: resPreset,
        quality: qualPreset,
        outputFile,
        onProgress: reportProgress,
      });

      console.log(
        `\nRendered ${result.outputFile} — ${result.width}x${result.height} @ ${result.fps}fps ` +
          `[Quality: ${result.quality}], ${result.totalFrames} frames, in ${(result.elapsedMs / 1000).toFixed(1)}s`,
      );
      return;
    }

    const compName = options.composition ?? 'bouncing-ball';
    const composition = findComposition(compName);
    assertCompositionAssets(composition);

    const outputFile = options.output ?? `out/${composition.id}-${qualPreset}.mp4`;
    const result = await render({
      ...composition,
      quality: qualPreset,
      outputFile,
      onProgress: reportProgress,
    });

    console.log(
      `\nRendered ${result.outputFile} — ${result.width}x${result.height} @ ${result.fps}fps ` +
        `[Quality: ${result.quality}], ${result.totalFrames} frames, in ${(result.elapsedMs / 1000).toFixed(1)}s`,
    );
  });

program
  .command('validate')
  .description('Check that referenced assets exist and scan overall asset manifest')
  .option('--composition <name>', 'validate a single composition (default: all)')
  .action((options: { composition?: string }) => {
    const targets = options.composition
      ? [findComposition(options.composition)]
      : compositions;

    let failed = false;
    for (const composition of targets) {
      const checks = checkCompositionAssets(composition);
      console.log(`\n${composition.id}:`);
      for (const check of checks) {
        if (!check.exists) failed = true;
        console.log(`  [${check.exists ? 'ok  ' : 'MISS'}] ${check.kind.padEnd(6)} ${check.path}`);
      }
      console.log(`  [info] ${checks.length} asset(s) declared`);
    }

    console.log('\nScanning local asset manifest...');
    const manifest = scanAssetManifest();
    console.log(`Discovered ${manifest.totalCount} asset(s) across assets/ folder:`);
    console.log(`  Images : ${manifest.images.length}`);
    console.log(`  Audio  : ${manifest.audio.length}`);
    console.log(`  Fonts  : ${manifest.fonts.length}`);

    if (failed) {
      console.error('\nValidation failed: one or more composition assets are missing.');
      process.exit(1);
    }
    console.log('\nValidation passed.');
  });

program
  .command('list')
  .description('List available compositions')
  .action(() => {
    for (const c of compositions) {
      const assets = c.assets?.length ?? 0;
      console.log(
        `${c.id.padEnd(16)} ${c.width}x${c.height} @ ${c.fps}fps, ` +
          `${c.durationInSeconds}s, ${assets} asset(s)`,
      );
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof Error && err.message) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});