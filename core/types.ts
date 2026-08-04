import type { SKRSContext2D } from '@napi-rs/canvas';

/** Default prop bag used when a composition does not declare a stricter type. */
export type DefaultProps = Record<string, unknown>;

/** Quality Preset options for video encoding */
export type QualityPreset = 'draft' | 'standard' | 'high' | 'ultra';

/** Quality configuration mapping */
export interface QualityConfig {
  crf: number;
  preset: string;
  bitrate?: string;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  draft: { crf: 28, preset: 'ultrafast' },
  standard: { crf: 23, preset: 'fast' },
  high: { crf: 18, preset: 'medium' },
  ultra: { crf: 14, preset: 'slow' },
};

/** Preset Resolution Options */
export type ResolutionPreset = '720p' | '1080p' | '1440p' | '4k' | 'custom';

export interface Resolution {
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: Record<Exclude<ResolutionPreset, 'custom'>, Resolution> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
};

/** Canonical resolution constants */
export const HD_720 = RESOLUTION_PRESETS['720p'];
export const FHD_1080 = RESOLUTION_PRESETS['1080p'];
export const QHD_1440 = RESOLUTION_PRESETS['1440p'];
export const UHD_4K = RESOLUTION_PRESETS['4k'];

/** A single audio track to be muxed into the final output. */
export interface AudioTrack {
  path: string;
  startAt?: number;
  volume?: number;
}

/** Text overlay entry inside a Storyboard Scene */
export interface TextOverlaySpec {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  x?: number;
  y?: number;
  align?: 'left' | 'center' | 'right';
  animation?: 'fadeIn' | 'slideUp' | 'typewriter' | 'none';
}

/** Media asset entry inside a Storyboard Scene */
export interface MediaAssetSpec {
  path: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
}

/** Theme configuration for a Storyboard Scene */
export interface StoryboardThemeSpec {
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
}

/** Transition configuration for a Storyboard Scene */
export interface StoryboardTransitionSpec {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  durationInSeconds?: number;
}

/** Single scene specification in a Storyboard JSON */
export interface StoryboardSceneSpec {
  sceneNumber: number;
  durationInSeconds: number;
  startFrame?: number;
  endFrame?: number;
  transition?: StoryboardTransitionSpec;
  theme?: StoryboardThemeSpec;
  textOverlays?: TextOverlaySpec[];
  mediaAssets?: MediaAssetSpec[];
  audio?: AudioTrack[];
}

/** Master Storyboard Specification JSON structure */
export interface StoryboardSpec {
  title: string;
  version?: string;
  width?: number;
  height?: number;
  fps?: number;
  quality?: QualityPreset;
  output?: string;
  scenes: StoryboardSceneSpec[];
}

/** The pure mathematical scene function. */
export type RenderFrame<Props = DefaultProps> = (
  ctx: SKRSContext2D,
  frame: number,
  fps: number,
  props: Props,
) => void;

/** A registered, renderable composition. */
export interface Composition<Props = DefaultProps> {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInSeconds: number;
  assets?: string[];
  audio?: AudioTrack[];
  defaultProps?: Props;
  renderFrame: RenderFrame<Props>;
}

export type ProgressFn = (frame: number, totalFrames: number) => void;

export interface RenderOptions extends Composition {
  outputFile?: string;
  tmpDir?: string;
  keepFrames?: boolean;
  quality?: QualityPreset;
  ffmpegPath?: string;
  onProgress?: ProgressFn;
}

export interface RenderResult {
  outputFile: string;
  width: number;
  height: number;
  fps: number;
  quality: QualityPreset;
  totalFrames: number;
  elapsedMs: number;
}
