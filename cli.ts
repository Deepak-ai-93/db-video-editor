import { Command } from 'commander';
import { render, type Composition } from './core/engine.ts';
import { compositions } from './compositions/index.ts';
import { assertCompositionAssets, checkCompositionAssets, scanAssetManifest } from './core/validate.ts';
import { initWorkspace } from './core/init.ts';

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

program.name('video-engine').description('Custom local video engine CLI').version('0.1.0');

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
  .command('render')
  .description('Validate assets and render a composition to MP4')
  .requiredOption('--composition <name>', 'composition id to render')
  .option('--output <file>', 'output mp4 path (default: out/<id>.mp4)')
  .action(async (options: { composition: string; output?: string }) => {
    const composition = findComposition(options.composition);
    assertCompositionAssets(composition);

    const outputFile = options.output ?? `out/${composition.id}.mp4`;
    const result = await render({
      ...composition,
      outputFile,
      onProgress: reportProgress,
    });

    console.log(
      `Rendered ${result.outputFile} — ${result.width}x${result.height} @ ${result.fps}fps, ` +
        `${result.totalFrames} frames, in ${(result.elapsedMs / 1000).toFixed(1)}s`,
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