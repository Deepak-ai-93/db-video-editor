import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const LOG_FILE = path.join(ROOT, 'content', 'token-usage-log.json');
const CACHE_DIR = path.join(ROOT, 'content', '.token-cache');

export interface TokenUsageRecord {
  timestamp: string;
  promptFile: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cached: boolean;
  tokensSaved: number;
}

export interface TokenLog {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokensUsed: number;
  totalTokensSaved: number;
  totalRuns: number;
  records: TokenUsageRecord[];
}

export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function loadTokenLog(): TokenLog {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch {
      // Fallback on parse error
    }
  }
  return {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokensUsed: 0,
    totalTokensSaved: 0,
    totalRuns: 0,
    records: [],
  };
}

export function saveTokenLog(log: TokenLog): void {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

export function getCachedStoryboard(promptContent: string): string | null {
  const hash = hashString(promptContent);
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf8');
  }
  return null;
}

export function setCachedStoryboard(promptContent: string, storyboardJson: string): void {
  const hash = hashString(promptContent);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  fs.writeFileSync(cacheFile, storyboardJson, 'utf8');
}

export function recordTokenUsage(params: {
  promptFile: string;
  promptContent: string;
  storyboardJson: string;
  isCached: boolean;
}): TokenUsageRecord {
  const log = loadTokenLog();

  const promptHash = hashString(params.promptContent);
  // Estimate tokens based on word/character ratios (~4 chars per token)
  const estimatedPromptTokens = Math.ceil(params.promptContent.length / 4);
  const estimatedCompletionTokens = Math.ceil(params.storyboardJson.length / 4);
  const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

  let tokensSaved = 0;
  let usedPrompt = estimatedPromptTokens;
  let usedCompletion = estimatedCompletionTokens;

  if (params.isCached) {
    tokensSaved = totalTokens;
    usedPrompt = 0;
    usedCompletion = 0;
  }

  const record: TokenUsageRecord = {
    timestamp: new Date().toISOString(),
    promptFile: params.promptFile,
    promptHash,
    promptTokens: usedPrompt,
    completionTokens: usedCompletion,
    totalTokens: usedPrompt + usedCompletion,
    cached: params.isCached,
    tokensSaved,
  };

  log.totalPromptTokens += usedPrompt;
  log.totalCompletionTokens += usedCompletion;
  log.totalTokensUsed += usedPrompt + usedCompletion;
  log.totalTokensSaved += tokensSaved;
  log.totalRuns += 1;
  log.records.push(record);

  saveTokenLog(log);

  if (!params.isCached) {
    setCachedStoryboard(params.promptContent, params.storyboardJson);
  }

  return record;
}
