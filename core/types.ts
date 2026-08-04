import type { SKRSContext2D } from '@napi-rs/canvas';

/** Default prop bag used when a composition does not declare a stricter type. */
export type DefaultProps = Record<string, unknown>;

/**
 * The pure mathematical scene function required by the composition framework.
 */
export type RenderFrame<Props = DefaultProps> = (
  ctx: SKRSContext2D,
  frame: number,
  fps: number,
  props: Props,
) => void;

/** A single audio track to be muxed into the final output. */
export interface AudioTrack {
  /** Path to the audio file. Relative paths resolve against the assets root. */
  path: string;
  /** Offset in seconds into the final timeline where this track begins. */
  startAt?: number;
  /** Linear gain, 0..1 (defaults to 1). */
  volume?: number;
}

/** Canonical resolution presets. */
export interface Resolution {
  width: number;
  height: number;
}

/** 4K UHD. */
export const UHD_4K: Resolution = { width: 3840, height: 2160 };
/** Full HD. */
export const FHD_1080: Resolution = { width: 1920, height: 1080 };
/** HD. */
export const HD_720: Resolution = { width: 1280, height: 720 };

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
  output?: string;
  scenes: StoryboardSceneSpec[];
}

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

/** A scene as authored in a project script JSON file. */
export interface SceneSpec {
  id: string;
  durationInSeconds: number;
  props?: DefaultProps;
  audio?: AudioTrack[];
}

/** The top-level project script format consumed by `cli.ts build`. */
export interface ProjectScript {
  version?: number;
  title?: string;
  output?: string;
  width?: number;
  height?: number;
  fps?: number;
  encoder?: string;
  concurrency?: number;
  scenes: SceneSpec[];
}

/** A fully resolved, serialisable timeline segment. */
export interface SegmentSpec {
  compositionId: string;
  startFrame: number;
  frameCount: number;
  fps: number;
  props: DefaultProps;
}

/** The full serialisable description of a render. */
export interface TimelineSpec {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  segments: SegmentSpec[];
}

/** An audio track pinned to an absolute timeline offset (post-resolution). */
export interface AudioPlan extends AudioTrack {
  startAt: number;
  volume: number;
  absolutePath: string;
}

/** A complete render job handed to the engine. */
export interface RenderPlan {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  timeline: TimelineSpec;
  audio: AudioPlan[];
  output: string;
}

/** Progress callback: (framesWrittenSoFar, totalFrames). */
export type ProgressFn = (frame: number, totalFrames: number) => void;

/** Options accepted by render. */
export interface RenderOptions {
  ffmpegPath?: string;
  ffprobePath?: string;
  encoder?: string;
  concurrency?: number;
  onProgress?: ProgressFn;
}

/** Result returned by render. */
export interface RenderResult {
  outputFile: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  elapsedMs: number;
  encoder: string;
  hardware: boolean;
  concurrency: number;
}
