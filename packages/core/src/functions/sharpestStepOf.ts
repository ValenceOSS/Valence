import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';

type QualityStep = (typeof QUALITY_STEPS)[number];

const NEARLY = 0.95;

/**
 * The sharpest quality step a picture reaches, judged by its width or its height, whichever gets
 * there: a widescreen film is as wide as 4K and not as tall, and a four-by-three one as tall as
 * 1080p and not as wide, and both are what they look like.
 *
 * A picture within a twentieth of a step counts as reaching it, since an encode trimmed by a few
 * pixels is not a smaller film.
 *
 * @param size - How big the picture is.
 * @returns The step, or null for a picture too small for any.
 */
const sharpestStepOf = (size: { width: number; height: number }): QualityStep | null =>
  QUALITY_STEPS.find(
    (step) => size.width >= step.maxWidth * NEARLY || size.height >= step.maxHeight * NEARLY,
  ) ?? null;

export { sharpestStepOf };
