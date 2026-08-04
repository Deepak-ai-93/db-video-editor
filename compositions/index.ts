import type { Composition } from '../core/engine.ts';
import { bouncingBall } from './bouncing-ball.ts';
import { gradientSpin } from './gradient-spin.ts';
import { techPromo } from './tech-promo.ts';

export const compositions: Composition[] = [bouncingBall, gradientSpin, techPromo];