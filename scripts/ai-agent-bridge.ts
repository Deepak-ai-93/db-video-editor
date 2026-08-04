import fs from 'node:fs';
import path from 'node:path';
import { runPlanner } from './storyboard-planner.ts';
import { renderStoryboard } from '../core/engine.ts';
import type { StoryboardSpec, QualityPreset, ResolutionPreset } from '../core/types.ts';

const ROOT = process.cwd();

export interface AgentRequest {
  promptPath?: string;
  promptText?: string;
  storyboardPath?: string;
  resolution?: ResolutionPreset;
  quality?: QualityPreset;
  outputFile?: string;
}

export interface AgentResponse {
  success: boolean;
  storyboardPath: string;
  outputVideoPath: string;
  resolution: string;
  quality: string;
  scenesCount: number;
  totalFrames: number;
  elapsedSeconds: number;
}

/**
 * AI Agent Bridge Interface designed specifically for OpenCode, Claude Code, and Antigravity CLI.
 * AI agents invoke this programmatically or via JSON payload input to perform zero-CLI headless video generation.
 */
export async function executeAgentWorkflow(request: AgentRequest): Promise<AgentResponse> {
  const startedAt = Date.now();
  console.log(`[ai-agent-bridge] Initializing AI Agent workflow...`);

  // 1. Resolve prompt input
  let promptFile = request.promptPath ?? path.join(ROOT, 'content', 'promo-idea-1.md');
  if (request.promptText) {
    promptFile = path.join(ROOT, 'content', 'agent-prompt.md');
    fs.writeFileSync(promptFile, request.promptText, 'utf8');
    console.log(`[ai-agent-bridge] Wrote agent prompt text to ${promptFile}`);
  }

  const storyboardPath = request.storyboardPath ?? path.join(ROOT, 'content', 'storyboard.json');

  // 2. Synthesize Storyboard JSON via Planner with Token Caching
  console.log(`[ai-agent-bridge] Synthesizing Storyboard from ${promptFile}...`);
  const storyboard = runPlanner({
    inputFile: promptFile,
    outputFile: storyboardPath,
  });

  const resPreset = request.resolution ?? '4k';
  const qualPreset = request.quality ?? 'high';
  const outputFile = request.outputFile ?? storyboard.output ?? path.join(ROOT, 'out', 'agent-render-4k.mp4');

  // 3. Trigger 4K Canvas Render Pipeline
  console.log(`[ai-agent-bridge] Rendering Storyboard [Res: ${resPreset}, Quality: ${qualPreset}] -> ${outputFile}...`);
  const result = await renderStoryboard({
    storyboard,
    resolution: resPreset,
    quality: qualPreset,
    outputFile,
  });

  const elapsedSeconds = (Date.now() - startedAt) / 1000;
  console.log(`[ai-agent-bridge] AI Agent Workflow completed successfully in ${elapsedSeconds.toFixed(1)}s!`);

  return {
    success: true,
    storyboardPath,
    outputVideoPath: result.outputFile,
    resolution: `${result.width}x${result.height}`,
    quality: result.quality,
    scenesCount: storyboard.scenes.length,
    totalFrames: result.totalFrames,
    elapsedSeconds,
  };
}

// CLI entrypoint when executed directly by AI Agents (OpenCode, Claude Code, Antigravity CLI)
if (process.argv[1] && process.argv[1].endsWith('ai-agent-bridge.ts')) {
  const arg = process.argv[2];
  let req: AgentRequest = {};

  if (arg && arg.endsWith('.json')) {
    const absJson = path.resolve(ROOT, arg);
    if (fs.existsSync(absJson)) {
      req = JSON.parse(fs.readFileSync(absJson, 'utf8'));
    }
  } else if (arg && arg.endsWith('.md')) {
    req.promptPath = arg;
  }

  executeAgentWorkflow(req)
    .then((res) => {
      console.log(`\nAI Agent Payload Output:\n${JSON.stringify(res, null, 2)}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[ai-agent-bridge error]`, err);
      process.exit(1);
    });
}
