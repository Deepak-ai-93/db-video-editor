/**
 * Interpolation math helpers: spring physics, easing curves, linear
 * interpolation and keyframe sampling. Everything here is pure and stateless
 * so it can be called from any render frame, in any thread, deterministically.
 */

/** Clamp `value` into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation from `a` to `b` at normalized position `t` (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Inverse of lerp: map `value` in `[a,b]` to a 0..1 ratio (un-clamped). */
export function invlerp(a: number, b: number, value: number): number {
  return b === a ? 0 : (value - a) / (b - a);
}

/** Remap `value` from `[inMin,inMax]` to `[outMin,outMax]` (un-clamped). */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return lerp(outMin, outMax, invlerp(inMin, inMax, value));
}

/**
 * Normalised linear progress of `t` through the window `[start,end]`, clamped
 * to 0..1. The backbone of every time-based animation in the compositions.
 */
export function progress(t: number, start: number, end: number): number {
  if (end === start) return t >= end ? 1 : 0;
  return clamp((t - start) / (end - start), 0, 1);
}

/** Linear fade-in factor (alias of {@link progress}). */
export const fadeIn = progress;

/* ------------------------------------------------------------------ *
 * Easing curves                                                       *
 * ------------------------------------------------------------------ */

export type Easing = (p: number) => number;

/** Linear easing (identity). */
export const easeLinear: Easing = (p) => p;
/** Quadratic ease-in. */
export const easeInQuad: Easing = (p) => p * p;
/** Quadratic ease-out. */
export const easeOutQuad: Easing = (p) => 1 - (1 - p) * (1 - p);
/** Quadratic ease-in-out. */
export const easeInOutQuad: Easing = (p) =>
  p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
/** Cubic ease-in. */
export const easeInCubic: Easing = (p) => p * p * p;
/** Cubic ease-out. */
export const easeOutCubic: Easing = (p) => 1 - Math.pow(1 - p, 3);
/** Cubic ease-in-out. */
export const easeInOutCubic: Easing = (p) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
/** Quartic ease-in-out. */
export const easeInOutQuart: Easing = (p) =>
  p < 0.5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2;
/** Quintic ease-in-out. */
export const easeInOutQuint: Easing = (p) =>
  p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2;
/** Sine ease-in-out. */
export const easeInOutSine: Easing = (p) => -(Math.cos(Math.PI * p) - 1) / 2;
/** Exponential ease-in-out (avoids divide-by-zero at p=0). */
export const easeInOutExpo: Easing = (p) => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
};
/** Circular ease-in-out. */
export const easeInOutCirc: Easing = (p) =>
  p < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * p, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * p + 2, 2)) + 1) / 2;

const C1 = 1.70158;
const C3 = C1 + 1;
/** Ease-out-back: slightly overshoots past 1 then settles. */
export const easeOutBack: Easing = (p) => 1 + C3 * Math.pow(p - 1, 3) + C1 * Math.pow(p - 1, 2);
/** Ease-in-back: dips below 0 before rising. */
export const easeInBack: Easing = (p) => C3 * p * p * p - C1 * p * p;
/** Ease-out-elastic: damped oscillation settling to 1. */
export const easeOutElastic: Easing = (p) => {
  const c4 = (2 * Math.PI) / 3;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
};
/** Ease-out-bounce: a few diminishing bounces. */
export const easeOutBounce: Easing = (p) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (p < 1 / d1) return n1 * p * p;
  if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
  if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
  return n1 * (p -= 2.625 / d1) * p + 0.984375;
};
