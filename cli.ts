import { Command } from 'commander';
import { render, type Composition } from './core/engine.ts';
import { compositions } from './compositions/index.ts';
import { assertCompositionAssets, checkCompositionAssets } from './core/validate.ts';

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
  .description('Check that every asset referenced by a composition exists')
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

    if (failed) {
      console.error('\nValidation failed: one or more assets are missing.');
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