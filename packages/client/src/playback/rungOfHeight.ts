import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

/**
 * The quality a picture of this height is named as: the smallest rung tall enough to hold it, so a
 * film in scope at 1920x800 still reads as 1080p.
 *
 * @param height - The picture's height in pixels.
 * @returns The rung.
 */
const rungOfHeight = (height: number): QualityStepId =>
  [...QUALITY_STEPS].reverse().find((step) => step.maxHeight >= height)?.id ?? '2160p';

export { rungOfHeight };
